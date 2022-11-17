import { keydownHandler } from 'prosemirror-keymap';
import { Slice, Fragment, ResolvedPos } from 'prosemirror-model';
import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { cellAround, clipCells, fitSlice, getTableNodeTypes, isCellSelection, insertCells, inSameTable, isTextSelection, isInTable, nextCell, selectionCell, pastedCells, CellSelection, DispatchType, NodeName, TableMap, TableRole, TD_NODENAME, TH_NODENAME, AbstractDocumentUpdate } from 'common';

import { isValidHTMLElement } from '../util';
import { tableEditingPluginKey } from './plugin/tableEditing';

// ********************************************************************************
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js

// == Arrow =======================================================================
/** handle arrow key behavior when inside a Table Node */
const tableArrowHandlerCommand = (axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/down*/): Command => (state, dispatch, view) =>
  AbstractDocumentUpdate.execute(new TableArrowHandlerDocumentUpdate(axis, direction).update(state, state.tr, view), dispatch);
class TableArrowHandlerDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly axis: 'horizontal' | 'vertical', private readonly direction: -1/*left/up*/ | 1/*right/down*/) {/*nothing additional*/}

  /**
   * modify the given Transaction such that arrow key behavior is handled when
   * inside a Table Node
   */
  public update(editorState: EditorState, tr: Transaction, view?: EditorView) {
    const { selection } = editorState;
    if(isCellSelection(selection)) {
      return maybeSetCellSelection(Selection.near(selection.$headCell), tr);
    } /* else -- not a CellSelection */

    if(this.axis !== 'horizontal' && !selection.empty) return false/*do not allow*/;

    const isAtEndOfCell = view && isCursorAtEndOfCell(view, this.axis, this.direction);
    if(!isAtEndOfCell || isAtEndOfCell === null) return false/*not at the end of the Cell*/;

    if(this.axis == 'horizontal') {
      return maybeSetCellSelection(Selection.near(editorState.doc.resolve(selection.head + this.direction), this.direction), tr);
    } else {
      const $cellPos = editorState.doc.resolve(isAtEndOfCell),
            $nextCellPos = nextCell($cellPos, this.axis, this.direction);

      let newSelection;
      if($nextCellPos) { newSelection = Selection.near($nextCellPos, 1); }
      else if(this.direction < 0/*left*/) { newSelection = Selection.near(editorState.doc.resolve($cellPos.before(-1/*grandParent depth*/)), -1/*bias to the left*/); }
      else { newSelection = Selection.near(editorState.doc.resolve($cellPos.after(-1/*grandParent depth*/)), 1/*bias to the right*/); }

      return maybeSetCellSelection(newSelection, tr)/*updated*/;
    }
  }
}

/** handle shift arrow key behavior when inside of a  Table Node */
const tableShiftArrowHandlerCommand = (axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/down*/): Command => (state, dispatch, view) =>
  AbstractDocumentUpdate.execute(new TableShiftArrowHandlerDocumentUpdate(axis, direction).update(state, state.tr, view), dispatch);

class TableShiftArrowHandlerDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly axis: 'horizontal' | 'vertical', private readonly direction: -1/*left/up*/ | 1/*right/down*/) {/*nothing additional*/}

  /**
   * modify the given Transaction such that shift arrow key behavior is handled when
   * inside of a Table Node
  */
  public update(editorState: EditorState, tr: Transaction, view?: EditorView) {
    let { selection } = editorState;
    if(!isCellSelection(selection)) {
      const isAtEnd = view && isCursorAtEndOfCell(view, this.axis, this.direction);
      if(!isAtEnd || isAtEnd === null) return false/*nothing to do*/;

      selection = new CellSelection(editorState.doc.resolve(isAtEnd));
    } /* else -- Selection is CellSelection */

    const $nextCellHead = nextCell((selection as CellSelection/*guaranteed by above check*/).$headCell, this.axis, this.direction);
    if(!$nextCellHead) return false/*nothing to do*/;

    return maybeSetCellSelection(new CellSelection((selection as CellSelection/*guaranteed by above check*/).$anchorCell, $nextCellHead), tr)/*updated*/;
  }
}

// == Selection ===================================================================
// -- Set -------------------------------------------------------------------------
const maybeSetCellSelection = (selection: Selection, tr: Transaction) => {
  if(selection.eq(selection)) return false/*same Selection*/;

  tr.setSelection(selection).scrollIntoView();
  return tr/*updated*/;
};

// -- Delete ----------------------------------------------------------------------
/** delete a CellSelection if it exists */
const deleteCellSelectionCommand = (state: EditorState, dispatch: DispatchType) =>
  AbstractDocumentUpdate.execute(new DeleteCellSelectionDocumentUpdate().update(state, state.tr), dispatch);
class DeleteCellSelectionDocumentUpdate implements AbstractDocumentUpdate {
  constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that a CellSelection is deleted if it exists
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;
    if(!isCellSelection(selection)) return false/*nothing to do*/;

    const baseCell = getTableNodeTypes(editorState.schema)[NodeName.CELL].createAndFill();
    if(!baseCell) return false/*could not create baseCell*/;

    const baseContent = baseCell.content;
    selection.forEachCell((cell, pos) => {
      if(!cell) return/*nothing to do*/;

      if(!cell.content.eq(baseContent)) {
        tr.replace(tr.mapping.map(pos + 1), tr.mapping.map(pos + cell.nodeSize - 1), new Slice(baseContent, 0/*use full Slice*/, 0/*use full Slice*/));
      } /* else -- Cell already has the base content */
    });

    return tr/*updated*/;
  }
}

// == Click =======================================================================
export const handleCellTripleClick = (view: EditorView, pos: number) => {
  const { doc } = view.state;

  const $cellPos = cellAround(doc.resolve(pos));
  if(!$cellPos) return false/*did not click on a Cell*/;

  view.dispatch(view.state.tr.setSelection(new CellSelection($cellPos)));
  return true/*handled*/;
};

// == Paste =======================================================================
export const handleTablePaste = (view: EditorView, event: ClipboardEvent, slice: Slice) => {
  if(!isInTable(view.state)) return false/*do not handle*/;

  let cells = pastedCells(slice);
  const { selection } = view.state;

  if(isCellSelection(selection)) {
    if(!cells) {
      cells = { width: 1/*default*/, height: 1/*default*/, rows: [Fragment.from(fitSlice(getTableNodeTypes(view.state.schema).cell, slice))] };
    } /* else -- Cells exist */

    const table = selection.$anchorCell.node(-1/*grandParent*/),
          tableMap = TableMap.get(table),
          tableStart = selection.$anchorCell.start(-1/*grandParent depth*/);

    const tableRect = tableMap.rectBetween(selection.$anchorCell.pos - tableStart, selection.$headCell.pos - tableStart);
    cells = clipCells(cells, tableRect.right - tableRect.left, tableRect.bottom - tableRect.top);
    insertCells(view.state, view.dispatch, tableStart, tableRect, cells);

    return true/*handled*/;
  } else if(cells) {
    const selectedCell = selectionCell(view.state);
    if(!selectedCell) return false/*do not handle*/;

    const tableMap = TableMap.get(selectedCell.node(-1/*grandParent*/)),
          tableStart = selectedCell.start(-1/*grandParent depth*/);
    insertCells(view.state, view.dispatch, tableStart, tableMap.findCell(selectedCell.pos - tableStart), cells);
    return true/*handled*/;
  } else {
    return false/*do not handle*/;
  }
};

// == Mousedown ===================================================================
export const handleCellSelectionMousedown = (view: EditorView, startEvent: MouseEvent) => {
  // --------------------------------------------------------------------------------
  // create a CellSelection between the given anchor and the position under the mouse
  const setCellSelection = ($anchor: ResolvedPos, event: Event) => {
    let $head = isCellUnderMouse(view, event);

    const currentCellSelectionAnchor = tableEditingPluginKey.getState(view.state)?.currentCellSelectionAnchor;
    const isCellSelectionStarting = currentCellSelectionAnchor === null || currentCellSelectionAnchor === undefined;

    if(!$head || !inSameTable($anchor, $head)) {
      if(isCellSelectionStarting) { $head = $anchor/*default to be the same*/; }
      else { return/*do not handle*/; }
    } /* else -- valid $head or $anchor and $head are in the same Table */

    const cellSelection = new CellSelection($anchor, $head);
    if(isCellSelectionStarting || !view.state.selection.eq(cellSelection)) {
      const { tr } = view.state;
      tr.setSelection(cellSelection);

      if(isCellSelectionStarting) {
        tr.setMeta(tableEditingPluginKey, $anchor.pos);
      } /* else -- not starting the MouseEvent */

      view.dispatch(tr);
    }
  };

  // ------------------------------------------------------------------------------
  const stopMouseMotionTracking = () => {
    view.root.removeEventListener('mouseup', stopMouseMotionTracking);
    view.root.removeEventListener('dragstart', stopMouseMotionTracking);
    view.root.removeEventListener('mousemove', handleMouseMove);

    const tableEditingStateValue = tableEditingPluginKey.getState(view.state)?.currentCellSelectionAnchor;
    if(tableEditingStateValue) {
      view.dispatch(view.state.tr.setMeta(tableEditingPluginKey, -1/*stop*/));
    } /* else -- no tableEditing state */
  };

  // ------------------------------------------------------------------------------
  const handleMouseMove = (event: Event) => {
    if(!event.target || !isValidHTMLElement(event.target)) return/*nothing to do*/;

    const pluginState = tableEditingPluginKey.getState(view.state);
    const currentCellSelectionAnchor = pluginState?.currentCellSelectionAnchor;

    let $anchor;
    if(currentCellSelectionAnchor) {
      // continue an existing CellSelection
      $anchor = view.state.doc.resolve(currentCellSelectionAnchor);

    } else if(getDOMNodeInCell(view, event.target) !== startDOMCell) {
      $anchor = isCellUnderMouse(view, startEvent);
      if(!$anchor) {
        return stopMouseMotionTracking();
      } /* else -- do not stop yet */
    } /* else -- target is not the startingDOMCell */

    if($anchor) {
      setCellSelection($anchor, event);
    } /* else -- not a valid $anchor, do not set a CellSelection */
  };

  // -- Handler -------------------------------------------------------------------
  if(!startEvent.target || !isValidHTMLElement(startEvent.target)) return/*do not handle*/;
  if(startEvent.ctrlKey || startEvent.metaKey) return/*do not handle*/;

  const startDOMCell = getDOMNodeInCell(view, startEvent.target);
  let $anchor;
  if(startEvent.shiftKey && isCellSelection(view.state.selection)) {
    // adding to an existing cell selection
    setCellSelection(view.state.selection.$anchorCell, startEvent);
    startEvent.preventDefault();

  } else if(startEvent.shiftKey && startDOMCell && ($anchor = cellAround(view.state.selection.$anchor)) !== null && isCellUnderMouse(view, startEvent)?.pos !== $anchor.pos) {
    // adding to a Selection that starts in another Cell (causing a CellSelection
    // to be created)
    setCellSelection($anchor, startEvent);
    startEvent.preventDefault();

  } else if(!startDOMCell) {
    return/*not in a Cell, let PM handle the event*/;
  }

  // NOTE: this order is not arbitrary. It is important to add the listeners here
  view.root.addEventListener('mouseup', stopMouseMotionTracking);
  view.root.addEventListener('dragstart', stopMouseMotionTracking);
  view.root.addEventListener('mousemove', handleMouseMove);
};

// check whether the cursor is at the end of a Cell (such that further
// motion would move out of it)
const isCursorAtEndOfCell = (view: EditorView, axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/down*/) => {
  if(!isTextSelection(view.state.selection)) return null/*nothing to do*/;

  const { $head } = view.state.selection;
  for(let depth = $head.depth - 1; depth >= 0; depth--) {
    let ancestorNode = $head.node(depth);

    let index = direction < 0 ? $head.index(depth) : $head.indexAfter(depth);
    if(index !== (direction < 0 ? 0/*first child*/ : ancestorNode.childCount)) return null/*nothing to do*/;

    if(ancestorNode.type.spec.tableRole === TableRole.Cell || ancestorNode.type.spec.tableRole == TableRole.HeaderCell) {
      const cellPos = $head.before(depth);
      const directionString: 'left' | 'right' | 'up' | 'down' = axis === 'vertical' ? (direction > 0 ? 'down' : 'up') : direction > 0 ? 'right' : 'left';

      return view.endOfTextblock(directionString) ? cellPos : null;
    } /* else -- parent is not a Cell or a HeaderCell */
  }

  return null/*not at end of Cell*/;
};

const getDOMNodeInCell = (view: EditorView, dom: HTMLElement | false | null) => {
  for(; dom && dom !== view.dom; dom = dom.parentNode && isValidHTMLElement(dom.parentNode) && dom.parentNode) {
    if(dom.nodeName === TD_NODENAME || dom.nodeName == TH_NODENAME) return dom/*found a Cell or HeaderCell DOMNode*/;
  } /* else -- keep looking upwards through the View */

  return/*undefined*/;
};

const isCellUnderMouse = (view: EditorView, event: Event | MouseEvent) => {
  if(!isValidMouseEvent(event)) return null/*not a valid Event*/;

  const mousePos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if(!mousePos) return null/*no valid ViewPos at mousePos*/;

  return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null/*no Cell under mousePos*/;
};

// == Type Guard ==================================================================
const isValidMouseEvent = (event: Event): event is MouseEvent => 'clientX' in event && 'clientY' in event;

// == Keydown Handler =============================================================
export const handleTableArrowKeydown = keydownHandler({
  ArrowLeft: tableArrowHandlerCommand('horizontal', -1/*left*/),
  ArrowRight: tableArrowHandlerCommand('horizontal', 1/*right/down*/),
  ArrowUp: tableArrowHandlerCommand('vertical', -1/*left*/),
  ArrowDown: tableArrowHandlerCommand('vertical', 1/*right/down*/),

  'Shift-ArrowLeft': tableShiftArrowHandlerCommand('horizontal', -1/*left*/),
  'Shift-ArrowRight': tableShiftArrowHandlerCommand('horizontal', 1/*right/down*/),
  'Shift-ArrowUp': tableShiftArrowHandlerCommand('vertical', -1/*left*/),
  'Shift-ArrowDown': tableShiftArrowHandlerCommand('vertical', 1/*right/down*/),

  Backspace: deleteCellSelectionCommand,
  'Mod-Backspace': deleteCellSelectionCommand,
  Delete: deleteCellSelectionCommand,
  'Mod-Delete': deleteCellSelectionCommand,
});

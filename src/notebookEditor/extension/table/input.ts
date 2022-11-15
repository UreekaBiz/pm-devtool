import { keydownHandler } from 'prosemirror-keymap';
import { Slice, Fragment, ResolvedPos } from 'prosemirror-model';
import { Command, EditorState, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { cellAround, clipCells, fitSlice, getTableNodeTypes, isCellSelection, insertCells, inSameTable, isTextSelection, isInTable, nextCell, selectionCell, pastedCells, CellSelection, DispatchType, NodeName, TableMap, TableRole, TD_NODENAME, TH_NODENAME } from 'common';

import { tableEditingPluginKey } from './plugin/tableEditing';
import { isValidHTMLElement } from '../util';

// ********************************************************************************
// helpers for wiring up User input to Table related functionality

// == Arrow =======================================================================
const tableArrowHandler = (axis: 'horizontal' | 'vertical', dir: 1 | -1): Command => (state, dispatch, view) => {
  const { selection } = state;
  if(isCellSelection(selection)) {
    return maybeSetSelection(state, dispatch, Selection.near(selection.$headCell, dir));
  } /* else -- not a CellSelection */

  if(axis !== 'horizontal' && !selection.empty) return false/*do not allow*/;

  const end = view && atEndOfCell(view, axis, dir);
  if(!end || end === null) return false/*not at the end of the Cell*/;

  if(axis == 'horizontal') {
    return maybeSetSelection(state, dispatch, Selection.near(state.doc.resolve(selection.head + dir), dir));
  } else {
    const $cell = state.doc.resolve(end);
    const $next = nextCell($cell, axis, dir);
    let newSelection;

    if($next) { newSelection = Selection.near($next, 1); }
    else if(dir < 0) { newSelection = Selection.near(state.doc.resolve($cell.before(-1)), -1); }
    else { newSelection = Selection.near(state.doc.resolve($cell.after(-1)), 1); }

    return maybeSetSelection(state, dispatch, newSelection);
  }
};

const tableShiftArrowHandler = (axis: 'horizontal' | 'vertical', dir: 1 | -1): Command => (state, dispatch, view) => {
  let { selection } = state;
  if(!isCellSelection(selection)) {
    const atEnd = view && atEndOfCell(view, axis, dir);
    if(!atEnd || atEnd === null) return false/*nothing to do*/;

    selection = new CellSelection(state.doc.resolve(atEnd));
  } /* else -- Selection is CellSelection */

  const $head = nextCell((selection as CellSelection/*guaranteed by above check*/).$headCell, axis, dir);
  if(!$head) return false/*nothing to do*/;

  return maybeSetSelection(state, dispatch, new CellSelection((selection as CellSelection/*guaranteed by above check*/).$anchorCell, $head));
};

// == Selection ===================================================================
// -- Set -------------------------------------------------------------------------
const maybeSetSelection = (state: EditorState, dispatch: DispatchType, selection: Selection) => {
  if(selection.eq(state.selection)) return false/*same Selection*/;

  if(dispatch) dispatch(state.tr.setSelection(selection).scrollIntoView());
  return true;
};

// -- Delete ----------------------------------------------------------------------
const deleteCellSelection = (state: EditorState, dispatch: DispatchType) => {
  const { selection } = state;
  if(!isCellSelection(selection)) return false/*nothing to do*/;

  if(dispatch) {
    const { tr } = state;

    const baseCell = getTableNodeTypes(state.schema)[NodeName.CELL].createAndFill();
    if(!baseCell) return false/*could not create baseCell*/;

    const baseContent = baseCell.content;
    selection.forEachCell((cell, pos) => {
      if(!cell) return/*nothing to do*/;

      if(!cell.content.eq(baseContent)) {
        tr.replace(tr.mapping.map(pos + 1), tr.mapping.map(pos + cell.nodeSize - 1), new Slice(baseContent, 0/*use full Slice*/, 0/*use full Slice*/));
      } /* else -- Cell already has the base content */
    });

    if(tr.docChanged) dispatch(tr);
  }

  return true/*handled*/;
};

// == Click =======================================================================
export const handleTripleClick = (view: EditorView, pos: number) => {
  const { doc } = view.state;

  const $cell = cellAround(doc.resolve(pos));
  if(!$cell) return false/*did not click on a Cell*/;

  view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
  return true/*handled*/;
};

// == Paste =======================================================================
export const handlePaste = (view: EditorView, event: ClipboardEvent, slice: Slice) => {
  if(!isInTable(view.state)) return false/*do not handle*/;

  let cells = pastedCells(slice);
  const { selection } = view.state;

  if(isCellSelection(selection)) {
    if(!cells) {
      cells = { width: 1, height: 1, rows: [Fragment.from(fitSlice(getTableNodeTypes(view.state.schema).cell, slice))] };
    } /* else -- Cells exist */

    const table = selection.$anchorCell.node(-1);
    const map = TableMap.get(table);
    const start = selection.$anchorCell.start(-1);

    const rect = map.rectBetween(selection.$anchorCell.pos - start, selection.$headCell.pos - start);
    cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
    insertCells(view.state, view.dispatch, start, rect, cells);

    return true/*handled*/;
  } else if(cells) {
    const $cell = selectionCell(view.state);
    if(!$cell) return false/*do not handle*/;

    const map = TableMap.get($cell.node(-1));
    const start = $cell.start(-1);
    insertCells(view.state, view.dispatch, start, map.findCell($cell.pos - start), cells);
    return true/*handled*/;
  } else {
    return false/*do not handle*/;
  }
};

export const handleCellSelectionMousedown = (view: EditorView, startEvent: MouseEvent) => {
  // -- Helper --------------------------------------------------------------------
  // create a CellSelection between the given anchor and the position under the mouse
  const setCellSelection = ($anchor: ResolvedPos, event: Event) => {
    let $head = cellUnderMouse(view, event);

    const tableEditingStateValue = tableEditingPluginKey.getState(view.state)?.currentValue;
    const starting = tableEditingStateValue === null || tableEditingStateValue === undefined;

    if(!$head || !inSameTable($anchor, $head)) {
      if(starting) { $head = $anchor; }
      else { return/*do not handle*/; }
    } /* else -- valid $head or $anchor and $head are in the same Table */

    const selection = new CellSelection($anchor, $head);
    if(starting || !view.state.selection.eq(selection)) {
      const { tr } = view.state;
      tr.setSelection(selection);

      if(starting) {
        tr.setMeta(tableEditingPluginKey, $anchor.pos);
      } /* else -- not starting the MouseEvent */

      view.dispatch(tr);
    }
  };

  // stop listening to mouse motion events
  const stop = () => {
    view.root.removeEventListener('mouseup', stop);
    view.root.removeEventListener('dragstart', stop);
    view.root.removeEventListener('mousemove', move);

    const tableEditingStateValue = tableEditingPluginKey.getState(view.state)?.currentValue;
    if(tableEditingStateValue) {
      view.dispatch(view.state.tr.setMeta(tableEditingPluginKey, -1));
    } /* else -- no tableEditing state */
  };

  const move = (event: Event) => {
    if(!event.target || !isValidHTMLElement(event.target)) return/*nothing to do*/;

    const pluginState = tableEditingPluginKey.getState(view.state);
    const anchor = pluginState?.currentValue;

    let $anchor;
    if(anchor) {
      // continuing an existing cross-cell selection
      $anchor = view.state.doc.resolve(anchor);

    } else if(domInCell(view, event.target) !== startDOMCell) {
      $anchor = cellUnderMouse(view, startEvent);
      if(!$anchor) {
        return stop();
      } /* else -- do not stop yet */
    } /* else -- target is not the startingDOMCell */

    if($anchor) {
      setCellSelection($anchor, event);
    } /* else -- not a valid $anchor, do not set a CellSelection */
  };

  // -- Mousedown Handler ---------------------------------------------------------
  if(!startEvent.target || !isValidHTMLElement(startEvent.target)) return/*do not handle*/;
  if(startEvent.ctrlKey || startEvent.metaKey) return/*do not handle*/;

  const startDOMCell = domInCell(view, startEvent.target);
  let $anchor;
  if(startEvent.shiftKey && isCellSelection(view.state.selection)) {
    // adding to an existing cell selection
    setCellSelection(view.state.selection.$anchorCell, startEvent);
    startEvent.preventDefault();

  } else if(startEvent.shiftKey && startDOMCell && ($anchor = cellAround(view.state.selection.$anchor)) !== null && cellUnderMouse(view, startEvent)?.pos !== $anchor.pos) {
    // adding to a Selection that starts in another Cell (causing a CellSelection
    // to be created)
    setCellSelection($anchor, startEvent);
    startEvent.preventDefault();

  } else if(!startDOMCell) {
    return/*not in a Cell, let PM handle the event*/;
  }

  view.root.addEventListener('mouseup', stop);
  view.root.addEventListener('dragstart', stop);
  view.root.addEventListener('mousemove', move);
};

// check whether the cursor is at the end of a Cell (such that further
// motion would move out of the Cell)
const atEndOfCell = (view: EditorView, axis: 'horizontal' | 'vertical', dir: 1 | -1) => {
  if(!isTextSelection(view.state.selection)) return null/*nothing to do*/;

  const { $head } = view.state.selection;

  for(let d = $head.depth - 1; d >= 0; d--) {
    let parent = $head.node(d);

    let index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
    if(index !== (dir < 0 ? 0 : parent.childCount)) return null/*nothing to do*/;


    if(parent.type.spec.tableRole === TableRole.Cell || parent.type.spec.tableRole == TableRole.HeaderCell) {
      const cellPos = $head.before(d);
      const dirStr: 'left' | 'right' | 'up' | 'down' = axis === 'vertical' ? (dir > 0 ? 'down' : 'up') : dir > 0 ? 'right' : 'left';

      return view.endOfTextblock(dirStr) ? cellPos : null;
    } /* else -- parent is not a Cell or a HeaderCell */
  }

  return null/*not at end of Cell*/;
};

const domInCell = (view: EditorView, dom: HTMLElement | false | null) => {
  for(; dom && dom !== view.dom; dom = dom.parentNode && isValidHTMLElement(dom.parentNode) && dom.parentNode) {
    if(dom.nodeName === TD_NODENAME || dom.nodeName == TH_NODENAME) return dom;
  } /* else -- keep looking upwards through the View */

  return/*undefined*/;
};

const cellUnderMouse = (view: EditorView, event: Event | MouseEvent) => {
  if(!isValidMouseEvent(event)) return null/*not a valid Event*/;

  const mousePos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if(!mousePos) return null/*no valid ViewPos in mousePos */;

  return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null/*no Cell under mousePos*/;
};

// == Type Guard ==================================================================
const isValidMouseEvent = (event: Event): event is MouseEvent => 'clientX' in event && 'clientY' in event;

// == Handler =====================================================================
export const handleTableArrowKeydown = keydownHandler({
  ArrowLeft: tableArrowHandler('horizontal', -1),
  ArrowRight: tableArrowHandler('horizontal', 1),
  ArrowUp: tableArrowHandler('vertical', -1),
  ArrowDown: tableArrowHandler('vertical', 1),

  'Shift-ArrowLeft': tableShiftArrowHandler('horizontal', -1),
  'Shift-ArrowRight': tableShiftArrowHandler('horizontal', 1),
  'Shift-ArrowUp': tableShiftArrowHandler('vertical', -1),
  'Shift-ArrowDown': tableShiftArrowHandler('vertical', 1),

  Backspace: deleteCellSelection,
  'Mod-Backspace': deleteCellSelection,
  Delete: deleteCellSelection,
  'Mod-Delete': deleteCellSelection,
});

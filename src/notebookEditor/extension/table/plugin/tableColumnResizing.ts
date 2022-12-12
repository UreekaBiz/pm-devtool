import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

import { getResolvedCellPosAroundResolvedPos, isNotNullOrUndefined, isTableNode, isResolvedPosPointingAtCell, updateTableNodeAttributes, AncestorDepth, AttributeType, TableMap, PM_CLASS, TABLE_NODENAME, TD_NODENAME, TH_NODENAME } from 'common';

import { isValidHTMLElement } from 'notebookEditor/extension/util';

import { updateTableColumns } from '../node/table/util';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/columnresizing.js

// == Constant ====================================================================
const RESIZE_HANDLE_CLASS = 'resize-cursor'/*(SEE: table.css)*/;
const DEFAULT_CLASS_OBJ = { class: ''/*none*/ };

// -- Meta -------------------------------------------------------------------------
const dispatchSetHandleActionMeta = (view: EditorView, value: number) => {
  const setHandleAction: SetHandleObj = { value };
  view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, setHandleAction));
};

const dispatchSetDraggingActionMeta = (view: EditorView, startX: number, startWidth: number) => {
  const setDraggingAction: SetDragInfoObj = { startX, startWidth };
  view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, setDraggingAction));
};

const dispatchUnsetDraggingMeta = (view: EditorView) => {
  const deactivateDraggingAction: SetDragInfoObj = { startX: null/*not dragging*/, startWidth: null/*not dragging*/ };
  view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, deactivateDraggingAction));
};

// -- Plugin ----------------------------------------------------------------------
const getColumnResizePluginState = (state: EditorState) => {
  const pluginState = tableColumnResizingPluginKey.getState(state);
  if(!pluginState) throw new Error('tableColumnResizing state should always be defined by contract');

  return pluginState;
};

// == Type ========================================================================
type SetDragInfoObj = { startX: number | null; startWidth: number | null; };
type SetHandleObj = { value: number; }

type ResizeStateAction = SetHandleObj | SetDragInfoObj;

// -- Type Guard ------------------------------------------------------------------
const isSetHandleObj = (obj: any): obj is SetHandleObj => obj && 'value' in obj;
const isSetDragInfoObj = (obj: any): obj is SetDragInfoObj => obj && 'startX' in obj && 'startWidth' in obj;

// == Class =======================================================================
class ResizeState {
  // -- Attribute -----------------------------------------------------------------
  activeHandle: number | null/*mouse not inside a Table*/;
  dragInfo: SetDragInfoObj;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(activeHandle: number | null, dragging: SetDragInfoObj) {
    this.activeHandle = activeHandle;
    this.dragInfo = dragging;
  }

  public apply(tr: Transaction) {
    const action: ResizeStateAction = tr.getMeta(tableColumnResizingPluginKey);

    if(isSetHandleObj(action)) {
      this.activeHandle = action.value;
      this.dragInfo.startX = null/*not dragging*/;
      this.dragInfo.startWidth = null/*not dragging*/;

      return this;
    } /* else -- no action or action is not meant to set a Handle */

    if(isSetDragInfoObj(action)) {
      this.dragInfo.startX = action.startX;
      this.dragInfo.startWidth = action.startWidth;

      return this;
    } /* else -- no action or action is not meant to start dragging */

    if(this.activeHandle && this.activeHandle > -1 && tr.docChanged) {
      let mappedHandle: number | null = tr.mapping.map(this.activeHandle, -1/*associate to the left*/);
      if(!isResolvedPosPointingAtCell(tr.doc.resolve(mappedHandle))) {
        mappedHandle = null/*none*/;
      } /* else -- not pointing at a Cell */

      this.activeHandle = mappedHandle;

      return this;
    } /* else -- no currently active handle, currently active handle equals -1, or doc did not change */

    return this/*default*/;
  }
}

// == Key =========================================================================
export const tableColumnResizingPluginKey = new PluginKey<ResizeState>('tableColumnResizing');

// == Plugin ======================================================================
export const tableColumnResizingPlugin = (handleWidth: number, cellMinWidth: number, lastColumnResizable: boolean) => new Plugin({
  // -- Definition ----------------------------------------------------------------
  key: tableColumnResizingPluginKey,

  // -- State ---------------------------------------------------------------------
  state: {
    init: (_, state) => new ResizeState(-1/*default*/, { startX: null/*default not dragging*/, startWidth: null/*default not dragging*/ }),
    apply: (tr, thisPluginState, oldState, newState) => thisPluginState.apply(tr),
  },

  // -- Props ---------------------------------------------------------------------
  props: {
    // .. View Attribute ..........................................................
    attributes: (state) => {
      const pluginState = getColumnResizePluginState(state);
      const { activeHandle } = pluginState;

      if(activeHandle && activeHandle > -1) {
        return { class: RESIZE_HANDLE_CLASS };
      } /* else -- not active */

      return DEFAULT_CLASS_OBJ/*default*/;
    },

    // .. DOM Event ...............................................................
    handleDOMEvents: {
      mousedown: (view, event) => handleMouseDown(view, event, cellMinWidth),
      mousemove: (view, event) => handleMouseMove(view, event, handleWidth, lastColumnResizable),
      mouseleave: (view) => handleMouseLeave(view),
    },

    // .. Decoration ..............................................................
    decorations: (state) => {
      const pluginState = getColumnResizePluginState(state);
      const { activeHandle } = pluginState;

      if(activeHandle && activeHandle > -1) {
        return handleColumnResizingDecorations(state, pluginState.activeHandle);
      } /* else -- no activeHandle */

      return DecorationSet.empty/*default*/;
    },
  },
});

// == Handler =====================================================================
// -- MouseDown -------------------------------------------------------------------
const handleMouseDown = (view: EditorView, event: MouseEvent, cellMinWidth: number) => {
  const moveWhileDragging = (event: MouseEvent) => {
    if(!event.which) return finishDragging(event);

    const pluginState = getColumnResizePluginState(view.state);
    const { activeHandle, dragInfo } = pluginState;

    if(!isNotNullOrUndefined<number>(activeHandle) || (dragInfo.startX === null || dragInfo.startWidth === null)) return false/*do not handle*/;
    const draggedWidth = computeDraggedWidth(dragInfo.startX, dragInfo.startWidth, event, cellMinWidth);
    displayColumnWidth(view, activeHandle, draggedWidth, cellMinWidth);
  };

  const finishDragging = (event: MouseEvent) => {
    window.removeEventListener('mouseup', finishDragging);
    window.removeEventListener('mousemove', moveWhileDragging);

    const pluginState = getColumnResizePluginState(view.state);
    const { activeHandle, dragInfo } = pluginState;

    if(isNotNullOrUndefined<number>(activeHandle) && (dragInfo.startX && dragInfo.startWidth)) {
      updateColumnWidth(view, activeHandle, computeDraggedWidth(dragInfo.startX, dragInfo.startWidth, event, cellMinWidth));
      dispatchUnsetDraggingMeta(view);
    } /* else -- activeHandle is null or undefined, dragging is not defined, or dragging is not a draggingObject */
  };

  const pluginState = getColumnResizePluginState(view.state);
  const { activeHandle, dragInfo } = pluginState;

  if(activeHandle === -1 || (dragInfo.startX && dragInfo.startWidth /*dragging*/)) return false/*do not handle*/;
  if(!isNotNullOrUndefined<number>(activeHandle)) return false/*do not handle*/;

  const cell = view.state.doc.nodeAt(activeHandle);
  const width = getCurrentColumnWidth(view, activeHandle, cell?.attrs[AttributeType.ColSpan], cell?.attrs[AttributeType.ColWidth]);
  dispatchSetDraggingActionMeta(view, event.clientX, width);

  window.addEventListener('mousemove', moveWhileDragging);
  window.addEventListener('mouseup', finishDragging);
  event.preventDefault(/*prevent Selection change*/);
  return true/*handled*/;
};

// -- MouseMove -------------------------------------------------------------------
const handleMouseMove = (view: EditorView, event: MouseEvent, handleWidth: number, lastColumnResizable: boolean) => {
  const pluginState = getColumnResizePluginState(view.state);
  const { activeHandle, dragInfo } = pluginState;

  if(dragInfo.startX === null/*not dragging*/ && dragInfo.startWidth === null/*not dragging*/) {
    if(!isValidHTMLElement(event.target)) return false/*do not handle*/;

    const domTarget = domCellAround(event.target);
    let cellPos = -1/*default*/;
    if(domTarget) {
      const { left, right } = domTarget.getBoundingClientRect();

      if(event.clientX - left <= handleWidth) {
        cellPos = getCellEdge(view, event, 'left');
      } else if(right - event.clientX <= handleWidth) {
        cellPos = getCellEdge(view, event, 'right');
      } /* else -- do nothing */
    } /* else -- no domTarget exists */

    if(cellPos !== activeHandle) {
      if(!lastColumnResizable && cellPos !== -1) {
        const $cellPos = view.state.doc.resolve(cellPos);

        const table = $cellPos.node(AncestorDepth.GrandParent),
              tableMap = TableMap.getTableMap(table),
              tableStart = $cellPos.start(AncestorDepth.GrandParent);

        const columnCount = tableMap.getColumnAmountBeforePos($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
        if(columnCount === tableMap.width - 1) {
          return false/*do not handle*/;
        } /* else -- update the handle  */

      } /* else -- update the handle */

      dispatchSetHandleActionMeta(view, cellPos);
    } /* else -- cellPos equals the activeHandle */

  } /* else -- currently dragging */

  return false/*default to not handling*/;
};

// -- MouseLeave ------------------------------------------------------------------
const handleMouseLeave = (view: EditorView) => {
  const pluginState = getColumnResizePluginState(view.state);

  const { activeHandle, dragInfo } = pluginState;
  if(activeHandle && activeHandle > -1 && (dragInfo.startX === null/*not dragging*/ && dragInfo.startWidth === null/*not dragging*/)) {
    dispatchSetHandleActionMeta(view, -1/*default*/);
  } /* else -- no active Handle or currently dragging */
};

// == Decoration ==================================================================
export const handleColumnResizingDecorations = (state: EditorState, cellPos: number | null) => {
  if(!cellPos) return DecorationSet.empty;

  const decorations = [/*default empty*/];
  const $cellPos = state.doc.resolve(cellPos);

  const table = $cellPos.node(AncestorDepth.GrandParent);
  if(!table) return DecorationSet.empty/*no Decorations*/;

  const tableMap = TableMap.getTableMap(table),
        tableStart = $cellPos.start(AncestorDepth.GrandParent);

  const columnCount = tableMap.getColumnAmountBeforePos($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan];
  for(let row = 0; row < tableMap.height; row++) {
    const index = columnCount + row * tableMap.width - 1;

    // for positions that either have a different Cell or that have the
    // end of the Table to their right, and either the top of the Table
    // or a different Cell above them, add a decoration
    if((columnCount === tableMap.width || tableMap.map[index] !== tableMap.map[index + 1]) && (row === 0 || tableMap.map[index - 1] !== tableMap.map[index - 1 - tableMap.width])) {
      const cellPos = tableMap.map[index],
            cellNode = table.nodeAt(cellPos);
      if(!cellNode) throw new Error('expected Node to exist at pos');

      const decorationPos = tableStart + cellPos + cellNode.nodeSize - 1;
      const decorationDOM = document.createElement('div');
            decorationDOM.className = RESIZE_HANDLE_CLASS;
            decorations.push(Decoration.widget(decorationPos, decorationDOM));
    }
  }

  return DecorationSet.create(state.doc, decorations);
};

// == Util ========================================================================
// -- Cell ------------------------------------------------------------------------
const domCellAround = (target: HTMLElement | null) => {
  while(target && target.nodeName !== TD_NODENAME && target.nodeName !== TH_NODENAME) {
    if(target.classList && target.classList.contains(PM_CLASS)) {
      target = null/*stop*/;

    } else {
      if(!isValidHTMLElement(target.parentNode)) throw new Error('expected parentNode to be an HTMLElement');
      target = target.parentNode;
    }
  }
  return target;
};

const getCellEdge = (view: EditorView, event: MouseEvent, side: 'right' | 'left') => {
  const foundPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if(!foundPos) return -1/*default*/;

  const { pos, inside: posAtFoundCell } = foundPos;
  const $cellPos = getResolvedCellPosAroundResolvedPos(view.state.doc.resolve(pos));
  if(!$cellPos) return -1/*default*/;

  if(side === 'right') return $cellPos.pos;

  const tableMap = TableMap.getTableMap($cellPos.node(AncestorDepth.GrandParent)),
        tableStart = $cellPos.start(AncestorDepth.GrandParent);

  const cellPosTableMapIndex = tableMap.map.indexOf($cellPos.pos - tableStart);
  if(cellPosTableMapIndex % tableMap.width === 0) { return -1/*default*/; }
  else {
    const cellStartPos = tableStart + tableMap.map[cellPosTableMapIndex - 1];

    // prevent the handle from being shown for the Column if the Column is not
    // immediately after or before the Mouse. This specifically prevents the previous
    // Column from being highlighted incorrectly when hovering over the next one

    // this must be true for the normal behavior, yet it is incorrect when this
    // else clause runs. Hence, the check is only done here, even if
    // cellStartPos being less than posAtFoundCell is correct outside of this else
    if(cellStartPos < posAtFoundCell) return -1/*default*/;

    return cellStartPos;
  }
};

// -- ColWidth --------------------------------------------------------------------
const getCurrentColumnWidth = (view: EditorView, cellPos: number, colSpan: number, colWidth: number[]) => {
  const currentColWidth = colWidth && colWidth[colWidth.length - 1];
  if(currentColWidth) return currentColWidth/*colWidth already set*/;

  const domNodeAtCellPos = view.domAtPos(cellPos);
  const cellNode = domNodeAtCellPos.node.childNodes[domNodeAtCellPos.offset];
  if(!isValidHTMLElement(cellNode)) throw new Error('expected node to be an HTMLElement');

  let cellNodeDOMWidth = cellNode.offsetWidth;
  let amountOfSpanParts = colSpan;
  if(colWidth) {
    for(let i = 0; i < colSpan; i++) {
      if(colWidth[i]) {
        cellNodeDOMWidth -= colWidth[i];
        amountOfSpanParts--;
      }
    }
  } /* else -- Cell has no colWidth defined */

  return cellNodeDOMWidth / amountOfSpanParts;
};

const updateColumnWidth = (view: EditorView, cellPos: number, width: number) => {
  const $cellPos = view.state.doc.resolve(cellPos);

  const table = $cellPos.node(AncestorDepth.GrandParent),
        tableMap = TableMap.getTableMap(table),
        tableStart = $cellPos.start(-1/*grandParent depth*/);

  const columnCount = tableMap.getColumnAmountBeforePos($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
  const { tr } = view.state;
  for(let row = 0; row < tableMap.height; row++) {
    const mapIndex = row * tableMap.width + columnCount;
    if(row && tableMap.map[mapIndex] == tableMap.map[mapIndex - tableMap.width]) continue/*rowSpanning cell that has already been handled*/;

    const cellPos = tableMap.map[mapIndex];
    const cellNode = table.nodeAt(cellPos);
    if(!cellNode) throw new Error('expected Node to exist at pos');

    const { attrs } = cellNode;
    const index = attrs[AttributeType.ColSpan] === 1 ? 0 : columnCount - tableMap.getColumnAmountBeforePos(cellPos);
    if(attrs[AttributeType.ColWidth] && attrs[AttributeType.ColWidth][index] === width) continue/*no need to change column width*/;

    const newColWidth = attrs[AttributeType.ColWidth]
      ? attrs[AttributeType.ColWidth].slice(/*just copy*/)
      : createZeroesArray(attrs[AttributeType.ColSpan]);

    newColWidth[index] = width;
    tr.setNodeMarkup(tableStart + cellPos, null/*maintain type*/, updateTableNodeAttributes(attrs, AttributeType.ColWidth, newColWidth));
  }

  if(tr.docChanged) {
    view.dispatch(tr);
  } /* else -- nothing changed, do not dispatch Transaction */
};

const displayColumnWidth = (view: EditorView, cellPos: number, width: number, cellMinWidth: number) => {
  const $cellPos = view.state.doc.resolve(cellPos);

  const tableNode = $cellPos.node(AncestorDepth.GrandParent);
  if(!tableNode || !isTableNode(tableNode)) throw new Error('expected Table Node to exist');

  const tableStart = $cellPos.start(-1/*grandParent depth*/);

  const columnCount = TableMap.getTableMap(tableNode).getColumnAmountBeforePos($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
  let domNode = view.domAtPos($cellPos.start(-1/*grandParent depth*/)).node;
  while(domNode.parentNode && domNode.nodeName !== TABLE_NODENAME) {
    domNode = domNode.parentNode;
  }

  updateTableColumns(tableNode, domNode.firstChild as HTMLTableColElement/*by contract*/, domNode as HTMLTableElement/*by contract*/, cellMinWidth, columnCount, width);
};

// -- Misc ------------------------------------------------------------------------
/** return an array of n zeroes */
const createZeroesArray = (arrayLength: number) => {
  const zeroArray: 0[] = [];

  for(let i = 0; i < arrayLength; i++) {
    zeroArray.push(0);
  }

  return zeroArray;
};

/** return the width that has been dragged with the mouse */
const computeDraggedWidth = (startX: number, startWidth: number, event: MouseEvent, cellMinWidth: number) => {
  const offset = event.clientX - startX;
  return Math.max(cellMinWidth, startWidth + offset);
};

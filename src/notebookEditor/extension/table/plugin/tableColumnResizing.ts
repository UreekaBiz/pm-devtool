import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

import { cellAround, isNotNullOrUndefined, isTableNode, pointsAtCell, setTableNodeAttributes, AttributeType, TableMap, PM_CLASS, TABLE_NODENAME, TD_NODENAME, TH_NODENAME } from 'common';

import { isValidHTMLElement } from 'notebookEditor/extension/util';

import { updateTableColumns } from '../node';

// ********************************************************************************
// == Constant ====================================================================
const RESIZE_HANDLE_CLASS = 'resize-cursor'/*(SEE: table.css)*/;
const DEFAULT_CLASS_OBJ = { class: ''/*none*/ };

// == Type ========================================================================
type DraggingObjType = { startX: number; startWidth: number; };

// -- Type Guard -----------------------------------------------------------------
const isDraggingObjType = (obj: any): obj is DraggingObjType => 'startX' in obj && 'startWidth' in obj;

// == Class =======================================================================
class ResizeState {
  // -- Attribute -----------------------------------------------------------------
  activeHandle: number | null | undefined;
  dragging: number | boolean | null | DraggingObjType;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(activeHandle: number | null | undefined, dragging: number | boolean | null | DraggingObjType) {
    this.activeHandle = activeHandle;
    this.dragging = dragging;
  }

  public apply(tr: Transaction) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let state = this;
    const action = tr.getMeta(tableColumnResizingPluginKey);

    if(action && action.setHandle !== null) {
      return new ResizeState(action.setHandle, null);
    }

    if(action && action.setDragging !== undefined) {
      return new ResizeState(state.activeHandle, action.setDragging);
    }

    if(state.activeHandle && state.activeHandle > -1 && tr.docChanged) {
      let mappedHandle: number | null = tr.mapping.map(state.activeHandle, -1/*associate to the left*/);

      if(!pointsAtCell(tr.doc.resolve(mappedHandle))) {
        mappedHandle = null/*none*/;
      } /* else -- not pointing at a Cell */

      // @ts-ignore
      state = new ResizeState(mappedHandle, state.dragging);
    }

    return state;
  }
}

// == Key =========================================================================
export const tableColumnResizingPluginKey = new PluginKey<ResizeState>('tableColumnResizing');

// == Plugin ======================================================================
export const tableColumnResizingPlugin = (handleWidth: number, cellMinWidth: number, lastColumnResizable: boolean) => new Plugin({
  // -- State ---------------------------------------------------------------------
  key: tableColumnResizingPluginKey,
  state: {
    init(_, state) { return new ResizeState(-1, false); },
    apply(tr, thisPluginState, oldState, newState) {
      return thisPluginState.apply(tr);
    },
  },

  // -- Props ---------------------------------------------------------------------
  props: {
    // .. View Attribute ..........................................................
    attributes: (state) => {
      const pluginState = tableColumnResizingPluginKey.getState(state);
      if(!pluginState || !pluginState.activeHandle) return DEFAULT_CLASS_OBJ;

      if(pluginState.activeHandle > -1) {
        return { class: RESIZE_HANDLE_CLASS };
      } /* else -- not active */

      return DEFAULT_CLASS_OBJ/*default*/;
    },

    // .. DOM Event ...............................................................
    handleDOMEvents: {
      mousemove: (view, event) => handleMouseMove(view, event, handleWidth, cellMinWidth, lastColumnResizable),
      mouseleave: (view) => handleMouseLeave(view),
      mousedown: (view, event) => handleMouseDown(view, event, cellMinWidth),
    },

    // .. Decoration ..............................................................
    decorations: (state) => {
      const pluginState = tableColumnResizingPluginKey.getState(state);
      if(!pluginState || !pluginState.activeHandle) return DecorationSet.empty;

      if(pluginState.activeHandle > -1) {
        return handleColumnResizingDecorations(state, pluginState.activeHandle);
      } /* else -- no activeHandle */

      return DecorationSet.empty/*default*/;
    },
  },
});

// == Handler =====================================================================
const handleMouseMove = (view: EditorView, event: MouseEvent, handleWidth: number, cellMinWidth: number, lastColumnResizable: boolean) => {
  const pluginState = tableColumnResizingPluginKey.getState(view.state);
  if(!pluginState) return false/*do not handle*/;

  const { activeHandle, dragging } = pluginState;
  if(!dragging) {
    if(!isValidHTMLElement(event.target)) return false/*do not handle*/;

    const domTarget = domCellAround(event.target);
    let cellPos = -1/*default*/;
    if(domTarget) {
      const { left, right } = domTarget.getBoundingClientRect();

      if(event.clientX - left <= handleWidth) {
        cellPos = edgeCell(view, event, 'left');
      } else if(right - event.clientX <= handleWidth) {
        cellPos = edgeCell(view, event, 'right');
      } /* else -- do nothing */
    } /* else -- no domTarget exists */

    if(cellPos !== activeHandle) {
      if(!lastColumnResizable && cellPos !== -1) {
        const $cellPos = view.state.doc.resolve(cellPos);

        const tableNode = $cellPos.node(-1);
        const tableMap = TableMap.get(tableNode);
        const tableStart = $cellPos.start(-1);

        const col = tableMap.colCount($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
        if(col == tableMap.width - 1) {
          return false/*do not handle*/;
        } /* else -- update the handle  */

      } /* else -- update the handle */

      updateHandle(view, cellPos);
    } /* else -- cellPos equals the activeHandle */

  } /* else -- currently dragging */

  return false/*default to not handling*/;
};

const handleMouseLeave = (view: EditorView) => {
  const pluginState = tableColumnResizingPluginKey.getState(view.state);
  if(!pluginState) return/*do not handle*/;

  const { activeHandle, dragging } = pluginState;
  if(activeHandle && activeHandle > -1 && !dragging) {
    updateHandle(view, -1);
  } /* else -- no active Handle or currently dragging */
};

const handleMouseDown = (view: EditorView, event: MouseEvent, cellMinWidth: number) => {
  const pluginState = tableColumnResizingPluginKey.getState(view.state);
  if(!pluginState) return false/*do not handle*/;

  const { activeHandle, dragging } = pluginState;
  if(activeHandle === -1 || dragging) return false/*do not handle*/;

  if(!isNotNullOrUndefined<number>(activeHandle)) return false/*do not handle*/;

  const cell = view.state.doc.nodeAt(activeHandle);
  const width = currentColWidth(view, activeHandle, cell?.attrs[AttributeType.ColSpan], cell?.attrs[AttributeType.ColWidth]);
  view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, { setDragging: { startX: event.clientX, startWidth: width } }));

  const moveWhileDragging = (event: MouseEvent) => {
    if(!event.which) return finishDragging(event);

    const pluginState = tableColumnResizingPluginKey.getState(view.state);
    if(!pluginState) return finishDragging(event);

    const { activeHandle, dragging } = pluginState;
    if(!isNotNullOrUndefined<number>(activeHandle) || !isDraggingObjType(dragging)) throw new Error('expected pluginState to be valid');

    const dragged = draggedWidth(dragging, event, cellMinWidth);
    displayColumnWidth(view, activeHandle, dragged, cellMinWidth);
  };

  const finishDragging = (event: MouseEvent) => {
    window.removeEventListener('mouseup', finishDragging);
    window.removeEventListener('mousemove', moveWhileDragging);

    const pluginState = tableColumnResizingPluginKey.getState(view.state);
    if(!pluginState) return/*nothing to do*/;

    const { activeHandle, dragging } = pluginState;
    if(isNotNullOrUndefined<number>(activeHandle) && dragging && isDraggingObjType(pluginState.dragging)) {
      updateColumnWidth(view, activeHandle, draggedWidth(pluginState.dragging, event, cellMinWidth));
      view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, { setDragging: null/*deactivate dragging*/ }));
    } /* else -- activeHandle is null or undefined, dragging is not defined, or dragging is not a draggingObject */
  };

  window.addEventListener('mouseup', finishDragging);
  window.addEventListener('mousemove', moveWhileDragging);
  event.preventDefault();

  return true/*handled*/;
};

const currentColWidth = (view: EditorView, cellPos: number, colSpan: number, colWidth: number[]) => {
  const currentColWidth = colWidth && colWidth[colWidth.length - 1];
  if(currentColWidth) return currentColWidth/*colWidth already set*/;

  const dom = view.domAtPos(cellPos);

  const node = dom.node.childNodes[dom.offset];
  if(!isValidHTMLElement(node)) throw new Error('expected node to be an HTMLElement');

  let domWidth = node.offsetWidth;
  let parts = colSpan;
  if(colWidth) {
    for(let i = 0; i < colSpan; i++) {
      if(colWidth[i]) {
        domWidth -= colWidth[i];
        parts--;
      }
    }
  }

  return domWidth / parts;
};

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

const edgeCell = (view: EditorView, event: MouseEvent, side: 'right' | 'left') => {
  let found = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if(!found) return -1;

  let { pos } = found;
  let $cell = cellAround(view.state.doc.resolve(pos));
  if(!$cell) return -1;

  if(side == 'right') return $cell.pos;

  const tableMap = TableMap.get($cell.node(-1));
  const tableStart = $cell.start(-1);
  let index = tableMap.map.indexOf($cell.pos - tableStart);
  return index % tableMap.width == 0 ? -1 : tableStart + tableMap.map[index - 1];
};

const draggedWidth = (dragging: { startX: number; startWidth: number; }, event: MouseEvent, cellMinWidth: number) => {
  let offset = event.clientX - dragging.startX;
  return Math.max(cellMinWidth, dragging.startWidth + offset);
};

const updateHandle = (view: EditorView, value: number) => {
  view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, { setHandle: value }));
};

const updateColumnWidth = (view: EditorView, cellPos: number, width: number) => {
  const $cellPos = view.state.doc.resolve(cellPos);

  const table = $cellPos.node(-1);
  const tableMap = TableMap.get(table);
  const tableStart = $cellPos.start(-1);

  const col = tableMap.colCount($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
  const { tr } = view.state;

  for(let row = 0; row < tableMap.height; row++) {
    const mapIndex = row * tableMap.width + col;
    if(row && tableMap.map[mapIndex] == tableMap.map[mapIndex - tableMap.width]) continue/*rowSpanning cell that has already been handled*/;

    const pos = tableMap.map[mapIndex];
    const node = table.nodeAt(pos);
    if(!node) throw new Error('expected Node to exist at pos');

    const { attrs } = node;
    const index = attrs[AttributeType.ColSpan] === 1 ? 0 : col - tableMap.colCount(pos);
    if(attrs[AttributeType.ColWidth] && attrs[AttributeType.ColWidth][index] == width) continue;

    const colwidth = attrs[AttributeType.ColWidth]
      ? attrs[AttributeType.ColWidth].slice()
      : zeroes(attrs[AttributeType.ColSpan]);

    colwidth[index] = width;
    tr.setNodeMarkup(tableStart + pos, null/*maintain type*/, setTableNodeAttributes(attrs, AttributeType.ColWidth, colwidth));
  }

  if(tr.docChanged) {
    view.dispatch(tr);
  } /* else -- nothing changed, do not dispatch Transaction */
};

const displayColumnWidth = (view: EditorView, cellPos: number, width: number, cellMinWidth: number) => {
  const $cellPos = view.state.doc.resolve(cellPos);

  const tableNode = $cellPos.node(-1);
  if(!tableNode || !isTableNode(tableNode)) throw new Error('expected Table Node to exist');

  const tableStart = $cellPos.start(-1);

  const col = TableMap.get(tableNode).colCount($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
  let nodeDOM = view.domAtPos($cellPos.start(-1)).node;
  while(nodeDOM.parentNode && nodeDOM.nodeName !== TABLE_NODENAME) {
    nodeDOM = nodeDOM.parentNode;
  }

  updateTableColumns(tableNode, nodeDOM.firstChild as HTMLTableColElement/*by contract*/, nodeDOM as HTMLTableElement/*by contract*/, cellMinWidth, col, width);
};

/** return an array of n zeroes */
const zeroes = (n: number) => {
  const result: number[] = [];
  for(let i = 0; i < n; i++) {
    result.push(0);
  }
  return result;
};

export const handleColumnResizingDecorations = (state: EditorState, cellPos: number | null) => {
  if(!cellPos) return DecorationSet.empty;

  const decorations = [/*default empty*/];
  const $cellPos = state.doc.resolve(cellPos);

  const table = $cellPos.node(-1);
  if(!table) return DecorationSet.empty;

  const tableMap = TableMap.get(table);
  const tableStart = $cellPos.start(-1);

  const col = tableMap.colCount($cellPos.pos - tableStart) + $cellPos.nodeAfter?.attrs[AttributeType.ColSpan];
  for(let row = 0; row < tableMap.height; row++) {
    let index = col + row * tableMap.width - 1;
    // For positions that are have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if((col == tableMap.width || tableMap.map[index] != tableMap.map[index + 1]) && (row == 0 || tableMap.map[index - 1] != tableMap.map[index - 1 - tableMap.width])) {
      const cellPos = tableMap.map[index];

      const node = table.nodeAt(cellPos);
      if(!node) throw new Error('expected Node to exist at pos');

      const decorationPos = tableStart + cellPos + node.nodeSize - 1;
      const decorationDOM = document.createElement('div');
      decorationDOM.className = RESIZE_HANDLE_CLASS;
      decorations.push(Decoration.widget(decorationPos, decorationDOM));
    }
  }
  return DecorationSet.create(state.doc, decorations);
};

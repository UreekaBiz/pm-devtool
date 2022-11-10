import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

import { AttributeType, cellAround, pointsAtCell, setTableNodeAttributes, TableMap, TableNodeType, TABLE_NODENAME, TD_NODENAME, TH_NODENAME } from 'common';

import { isValidHTMLElement } from 'notebookEditor/extension/util';

import { updateTableColumns } from '../node/table/util';

// ********************************************************************************
// == Constant ====================================================================
const RESIZE_HANDLE_CLASS = 'dom-resize-handle';

// == Class =======================================================================
class TableResizeState {
  // -- Attribute -----------------------------------------------------------------
  public activeHandle: number;
  public dragging: boolean | { startX: number; startWidth: number; };

  // -- Lifecycle -----------------------------------------------------------------
  constructor(activeHandle: number, dragging: boolean | { startX: number; startWidth: number; }) {
    this.activeHandle = activeHandle;
    this.dragging = dragging;
  }

  public apply = (tr: Transaction, thisPluginState: TableResizeState, oldEditorState: EditorState, newEditorState: EditorState) => {
    const action = tr.getMeta(tableColumnResizingPluginKey);

    if(action && action.setHandle !== null) {
      return new TableResizeState(action.setHandle, false/*not dragging*/);
    } /* else -- no action or setHandle is null */

    if(action && action.setDragging !== undefined) {
      return new TableResizeState(this.activeHandle, action.setDragging);
    } /* else -- no action or setDragging is undefined */

    if(this.activeHandle && this.activeHandle > -1 && tr.docChanged) {
      let handle: number = tr.mapping.map(this.activeHandle, -1/*associate to the left*/);

      if(!pointsAtCell(tr.doc.resolve(handle))) {
        handle = -1;
      }

      const newState = new TableResizeState(handle, this.dragging);
      return newState;
    } /* else -- activeHandle less than -1 or doc did not change */

    return this;
  };
}

// == Key ======================================================================
export const tableColumnResizingPluginKey = new PluginKey<TableResizeState>('tableColumnResizing');

// == Plugin ======================================================================
export const tableColumnResizingPlugin = ({ handleWidth = 5, cellMinWidth = 25, lastColumnResizable = true } = {}) => new Plugin<TableResizeState>({
  key: tableColumnResizingPluginKey,
  state: {
    init(_, state) {
      return new TableResizeState(-1, false);
    },

    apply: (transaction, thisPluginState, oldState, newState) => thisPluginState.apply(transaction, thisPluginState, oldState, newState),
  },

  props: {
    // -- Attribute ---------------------------------------------------------------
    attributes(state) {
      const pluginState = tableColumnResizingPluginKey.getState(state);

      if(pluginState && pluginState.activeHandle) { return  { class: 'resize-cursor' }; }
      else { return { class: ''/*nothing*/ }; }
    },

    // -- Event -------------------------------------------------------------------
    handleDOMEvents: {
      mousemove: (view, event) => handleMouseMove(view, event, handleWidth, cellMinWidth, lastColumnResizable),
      mouseleave: (view) => handleMouseLeave(view),
      mousedown: (view, event) => handleMouseDown(view, event, cellMinWidth),
    },

    // -- Decoration --------------------------------------------------------------
    decorations(state) {
      const pluginState = tableColumnResizingPluginKey.getState(state);

      if(pluginState && pluginState.activeHandle && pluginState.activeHandle > -1) { return handleDecorations(state, pluginState.activeHandle); }
      else { return DecorationSet.empty;/*no decorations*/ }
    },
  },
});

// == Handler =====================================================================
const handleMouseMove = (view: EditorView, event: MouseEvent, handleWidth: number, cellMinWidth: number, lastColumnResizable: boolean) => {
  const pluginState = tableColumnResizingPluginKey.getState(view.state);

  if(pluginState && (!pluginState.dragging)) {
    const target = domCellAround(event.target);
    let cell = -1;

    if(target && isValidHTMLElement(target)) {
      let { left, right } = target.getBoundingClientRect();

      if(event.clientX - left <= handleWidth) {
        cell = edgeCell(view, event, 'left');
      } else if(right - event.clientX <= handleWidth) {
        cell = edgeCell(view, event, 'right');
      } /* else -- right is greater than or equal to handleWidth */
    }

    if(cell !== pluginState.activeHandle) {
      if(!lastColumnResizable && cell !== -1) {
        const $cell = view.state.doc.resolve(cell);
        const table = $cell.node(-1);

        const map = TableMap.get(table);

        const start = $cell.start(-1);
        const col = map.colCount($cell.pos - start) + $cell.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
        if(col === map.width - 1) {
          return /*nothing left to do*/;
        } /* else -- col is different than the map width -1 */
      } /* else -- can resize the last column or cell is equal to -1, update handle */

      updateHandle(view, cell);
    } /* else -- cell equals activeHandle, do nothing*/
  }
};

const handleMouseLeave = (view: EditorView) => {
  const pluginState = tableColumnResizingPluginKey.getState(view.state);

  if(pluginState && pluginState.activeHandle && pluginState.activeHandle > -1 && !pluginState.dragging) {
    updateHandle(view, -1);
  } /* else -- no pluginState, no activeHandle, activeHandle greater than -1, or dragging, do not update handle */
};

const handleMouseDown = (view: EditorView, event: MouseEvent, cellMinWidth: number) => {
  const pluginState = tableColumnResizingPluginKey.getState(view.state);
  if(!pluginState) return false/*do not handle event*/;

  if(pluginState.activeHandle && pluginState.activeHandle == -1 || (pluginState && pluginState.dragging)) return false/*do not handle event*/;

  const cell = view.state.doc.nodeAt(pluginState.activeHandle);
  const width = currentColWidth(view, pluginState.activeHandle, cell?.attrs[AttributeType.ColSpan], cell?.attrs[AttributeType.ColWidth]);
  view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, { setDragging: { startX: event.clientX, startWidth: width } }));

  const finish = (event: MouseEvent) => {
    window.removeEventListener('mouseup', finish);
    window.removeEventListener('mousemove', move);
    let pluginState = tableColumnResizingPluginKey.getState(view.state);
    if(!pluginState) return/*do not handle event*/;

    if(pluginState.dragging) {
      updateColumnWidth(view, pluginState.activeHandle, draggedWidth(pluginState.dragging, event, cellMinWidth));
      view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, { setDragging: null }));
    } /* else -- not dragging, do nothing */
  };

  const move = (event: MouseEvent) => {
    if(!event.which) return finish(event);

    const pluginState = tableColumnResizingPluginKey.getState(view.state);
    if(!pluginState) return finish(event);

    const dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
    displayColumnWidth(view, pluginState.activeHandle, dragged, cellMinWidth);
  };

  window.addEventListener('mouseup', finish);
  window.addEventListener('mousemove', move);
  event.preventDefault();

  return true/*event handled*/;
};

// == Util ========================================================================
const currentColWidth = (view: EditorView, cellPos: number, colSpan: number, colWidth: number[]) => {
  const width = colWidth && colWidth[colWidth.length - 1];
  if(width) return width;

  const dom = view.domAtPos(cellPos);
  const node = dom.node.childNodes[dom.offset];
  if(!isValidHTMLElement(node)) throw new Error('expected node to be a valid HTML element and its not');

  let domWidth = node.offsetWidth;
  let parts = colSpan;
  if(colWidth) {
    for(let i = 0; i < colSpan; i++) {
      if(colWidth[i]) {
        domWidth -= colWidth[i];
        parts--;
      } /* else -- no colWidth, do not change domWidth or parts */
    }
  } /* else -- no colWidth, do not iterate through colSpan */

  return domWidth / parts;
};

const domCellAround = (target: EventTarget | null) => {
  while(target && isValidHTMLElement(target) &&  target.nodeName !== TD_NODENAME && target.nodeName !== TH_NODENAME) {
    if(target.classList && target.classList.contains('ProseMirror')) { target = null/*break the loop*/; }
    else { target = target.parentNode; }
  }

  return target;
};

const edgeCell = (view: EditorView, event: MouseEvent, side: 'left' | 'right') => {
  const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if(!found) return -1/*default*/;

  const { pos } = found;
  const $cell = cellAround(view.state.doc.resolve(pos));
  if(!$cell) return -1/*default*/;

  if(side == 'right') {
    return $cell.pos;
  } /* else -- side is left */

  const map = TableMap.get($cell.node(-1));
  const start = $cell.start(-1);
  const index = map.map.indexOf($cell.pos - start);

  return index % map.width === 0 ? -1 : start + map.map[index - 1];
};

const draggedWidth = (dragging: boolean | { startX: number; startWidth: number; }, event: MouseEvent, cellMinWidth: number) => {
  let startX = 0/*default*/;
  let startWidth = 0/*default*/;

  if(typeof dragging === 'object') {
    startX = dragging.startX;
    startWidth = dragging.startWidth;
  }

  const offset = event.clientX - startX;
  return Math.max(cellMinWidth, startWidth + offset);
};

const updateHandle = (view: EditorView, value: number) => {
  view.dispatch(view.state.tr.setMeta(tableColumnResizingPluginKey, { setHandle: value }));
};

const updateColumnWidth = (view: EditorView, cell: number, width: number) => {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1);

  const map = TableMap.get(table);
  const start = $cell.start(-1);

  const col = map.colCount($cell.pos - start) + $cell.nodeAfter?.attrs[AttributeType.ColSpan] - 1;
  const tr = view.state.tr;
  for(let row = 0; row < map.height; row++) {
    const mapIndex = row * map.width + col;

    if(row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue/*row-spanning cell that has already been handled*/;

    const pos = map.map[mapIndex];
    const node = table.nodeAt(pos);
    if(!node) throw new Error('expected Node to exist and it does not');

    const { attrs } = node;
    const index = attrs[AttributeType.ColSpan] === 1
      ? 0
      : col - map.colCount(pos);
    if(attrs.colwidth && attrs.colwidth[index] == width) continue/*no need to do anything*/;

    const colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : zeroes(attrs[AttributeType.ColSpan]);
    colwidth[index] = width;
    tr.setNodeMarkup(start + pos, null/*do not change type*/, setTableNodeAttributes(attrs, AttributeType.ColWidth, colwidth));
  }

  if(tr.docChanged) {
    view.dispatch(tr);
  } /* else -- View's doc did not change after modifications, do not dispatch Transaction */
};

const displayColumnWidth = (view: EditorView, cell: number, width: number, cellMinWidth: number) => {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1);

  const map = TableMap.get(table);
  const start = $cell.start(-1);
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter?.attrs[AttributeType.ColSpan] - 1;

  let dom = view.domAtPos($cell.start(-1)).node;
  while(dom.nodeName !== TABLE_NODENAME && dom.parentNode) {
    dom = dom.parentNode;
  }

  if(!isValidHTMLElement(dom) || !dom.firstChild) return/*nothing to do*/;
  updateTableColumns(table as TableNodeType/*by definition*/, dom.firstChild as HTMLTableColElement/*by contract*/, dom as HTMLTableElement/*by contract*/, cellMinWidth, col, width);
};

/** return an array of n zeroes */
const zeroes = (n: number) => {
  const result = [];
  for(let i = 0; i < n; i++) {
    result.push(0);
  }

  return result;
};

export const handleDecorations = (state: EditorState, cell: number) => {
  const decorations = [];
  const $cell = state.doc.resolve(cell);

  const table = $cell.node(-1);
  if(!table) {
    return DecorationSet.empty;
  } /* else -- there is a Table to decorate */

  const map = TableMap.get(table);
  const start = $cell.start(-1);
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter?.attrs[AttributeType.ColSpan];

  for(let row = 0; row < map.height; row++) {
    const index = col + row * map.width - 1;
    // for positions that have either a different cell or the end of the
    // Table to their right, and either the top of the table or a
    // different cell above them, add a decoration
    if((col == map.width || map.map[index] != map.map[index + 1]) && (row == 0 || map.map[index - 1] != map.map[index - 1 - map.width])) {
      const cellPos = map.map[index];

      const node = table.nodeAt(cellPos);
      const nodeSize = node?.nodeSize || 0/*default*/;

      const pos = start + cellPos + nodeSize - 1;
      const dom = document.createElement('div');

      dom.className = RESIZE_HANDLE_CLASS;
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
};

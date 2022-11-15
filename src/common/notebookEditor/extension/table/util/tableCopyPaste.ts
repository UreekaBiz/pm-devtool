import { Slice, Fragment, Node as ProseMirrorNode, NodeType, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { Transform } from 'prosemirror-transform';

import { DispatchType } from '../../../command/type';
import { AttributeType } from '../../../attribute';
import { NodeName } from '../../../node';
import { CellSelection, TableMap, TableRect } from '../class';
import { getTableNodeTypes } from '../node/table';
import { TableRole } from '../type';
import { removeColSpan, setTableNodeAttributes } from '.';

// ********************************************************************************
// handle pasting Cell content into Tables, or pasting
// anything into a CellSelection, as replacing a block of Cells with
// the content of the Selection. When pasting Cells into a Cell, that
// involves placing the block of pasted content so that its top left
// aligns with the Selection Cell, optionally extending the table to
// the right or bottom to make sure it is large enough. Pasting into a
// CellSelection is different, since the Cells in the Selection are
// clipped to the Selection's rectangle, optionally repeating the
// pasted cells when they are smaller than the Selection

// == Cell ========================================================================
/**
 * get a rectangular area of Cells from a Slice, or null if the outer Nodes
 * of the Slice are not Table Cells or Rows
 */
export const pastedCells = (slice: Slice) => {
  if(!slice.size) return null/*nothing to do*/;

  let { content, openStart, openEnd } = slice;

  while(content.childCount === 1 && content.firstChild && ((openStart > 0 && openEnd > 0) || content.firstChild.type.spec.tableRole === TableRole.Table)) {
    openStart--;
    openEnd--;
    content = content.firstChild.content;
  }

  const firstChild = content.firstChild;
  if(!firstChild) throw new Error('content.firstChild is null when it was not expected to be');

  const firstChildRole = firstChild.type.spec.tableRole;
  const schema = firstChild.type.schema;
  const rows = [];

  if(firstChildRole === TableRole.Row) {
    for(let i = 0; i < content.childCount; i++) {
      let cells = content.child(i).content;

      const left = i ? 0/*default*/ : Math.max(0, openStart - 1);
      const right = i < content.childCount - 1 ? 0/*default*/ : Math.max(0, openEnd - 1);
      if(left || right) {
        cells = fitSlice(getTableNodeTypes(schema)[NodeName.ROW], new Slice(cells, left, right)).content;
      } /* else -- both left and right are 0 */

      rows.push(cells);
    }
  } else if(firstChildRole === TableRole.Cell || firstChildRole === TableRole.HeaderCell) {
    rows.push(openStart || openEnd ? fitSlice(getTableNodeTypes(schema)[NodeName.ROW], new Slice(content, openStart, openEnd)).content : content);
  } else {
    return null/*nothing to do*/;
  }

  return ensureRectangular(schema, rows);
};

// insert the given Cells (as returned by 'pastedCells') into a Table
// at the position pointed at by the given rect
export const insertCells = (state: EditorState, dispatch: DispatchType, tableStart: number, rect: TableRect, cells: { height: number; width: number; rows: Fragment[];}) => {
  let table = tableStart ? state.doc.nodeAt(tableStart - 1) : state.doc;
  if(!table) return/*nothing to do*/;

  let map = TableMap.get(table);
  const { top, left } = rect;
  const right = left + cells.width;
  const bottom = top + cells.height;

  const tr = state.tr;
  let mapFrom = 0;

  const recomputeTableMap = () => {
    table = tableStart ? tr.doc.nodeAt(tableStart - 1) : tr.doc;
    if(!table) return/*nothing to do*/;

    map = TableMap.get(table);
    mapFrom = tr.mapping.maps.length;
  };

  // prepare the Table to be large enough and not have any Cells crossing the
  // boundaries of the Rectangle that it must be inserted into. If anything
  // about it changes, recompute the TableMap so that subsequent operations
  // can see the current shape
  if(growTable(tr, map, table, tableStart, right, bottom, mapFrom)) {
    recomputeTableMap();
  } /* else -- no need to growTable */

  if(isolateHorizontal(tr, map, table, tableStart, left, right, top, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate horizontally */

  if(isolateHorizontal(tr, map, table, tableStart, left, right, bottom, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate horizontally */

  if(isolateVertical(tr, map, table, tableStart, top, bottom, left, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate vertically */

  if(isolateVertical(tr, map, table, tableStart, top, bottom, right, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate vertically */

  for(let row = top; row < bottom; row++) {
    const from = map.positionAt(row, left, table);
    const to = map.positionAt(row, right, table);
    tr.replace(tr.mapping.slice(mapFrom).map(from + tableStart), tr.mapping.slice(mapFrom).map(to + tableStart), new Slice(cells.rows[row - top], 0/*use full Slice*/, 0/*use full Slice*/));
  }

  recomputeTableMap();

  tr.setSelection(new CellSelection(tr.doc.resolve(tableStart + map.positionAt(top, left, table)), tr.doc.resolve(tableStart + map.positionAt(bottom - 1, right - 1, table))));

  if(dispatch) {
    dispatch(tr);
  } /* else -- do not dispatch the Transaction */
};

/**
 * clip or extend (repeat) the given set of Cells to cover the given
 * width and height. Will clip rowSpan/colSpan cells at the edges when they
 * stick out
 */
 export const clipCells = ({ width, height, rows }: { width: number; height: number; rows: Fragment[]; }, newWidth: number, newHeight: number) => {
  if(width !== newWidth) {
    const added: number[] = [];
    const newRows = [];

    for(let row = 0; row < rows.length; row++) {
      const fragment = rows[row];
      const cells = [];

      for(let col = added[row] || 0, i = 0; col < newWidth; i++) {
        let cell = fragment.child(i % fragment.childCount);
        if(col + cell.attrs[AttributeType.ColSpan] > newWidth) {
          cell = cell.type.create(removeColSpan( cell.attrs, cell.attrs[AttributeType.ColSpan], col + cell.attrs[AttributeType.ColSpan] - newWidth), cell.content);
        } /* else -- no need to recreate Cell */

        cells.push(cell);
        col += cell.attrs[AttributeType.ColSpan];

        for(let j = 1; j < cell.attrs[AttributeType.RowSpan]; j++) {
          added[row + j] = (added[row + j] || 0) + cell.attrs[AttributeType.ColSpan];
        }
      }
      newRows.push(Fragment.from(cells));
    }
    rows = newRows;
    width = newWidth;
  }

  if(height !== newHeight) {
    const newRows = [];
    for(let row = 0, i = 0; row < newHeight; row++, i++) {
      const cells = [];
      const source = rows[i % height];

      for(let j = 0; j < source.childCount; j++) {
        let cell = source.child(j);
        if(row + cell.attrs[AttributeType.RowSpan] > newHeight) {
          cell = cell.type.create(setTableNodeAttributes(cell.attrs, AttributeType.RowSpan, Math.max(1, newHeight - cell.attrs[AttributeType.RowSpan])), cell.content);
        } /* else -- no need to recreate Cell */
        cells.push(cell);
      }

      newRows.push(Fragment.from(cells));
    }

    rows = newRows;
    height = newHeight;
  }

  return { width, height, rows };
};

// == Slice =======================================================================
export const fitSlice = (nodeType: NodeType, slice: Slice) => {
  const node = nodeType.createAndFill();
  if(!node) throw new Error(`could not create a node of type ${nodeType.name}`);

  const tr = new Transform(node).replace(0/*start of doc*/, node.content.size, slice);
  return tr.doc;
};


// == Util ========================================================================
// ensure that a Table has at least the given width and height. Return true
// if something was changed
const growTable = (tr: Transaction, map: TableMap, table: ProseMirrorNode, start: number, width: number, height: number, mapFrom: number) => {
  const schema = tr.doc.type.schema;
  const tableTypes = getTableNodeTypes(schema);

  let emptyCell: ProseMirrorNode | null = null/*default*/,
      emptyHeader: ProseMirrorNode | null = null/*default*/;

  if(width > map.width) {
    for(let row = 0, rowEnd = 0; row < map.height; row++) {
      let rowNode = table.child(row);
      rowEnd += rowNode.nodeSize;
      const cells: ProseMirrorNode[] = [];
      let addedNode: ProseMirrorNode | null = null/*default*/;

      if(rowNode.lastChild == null || rowNode.lastChild.type == tableTypes.cell) { addedNode = emptyCell || (emptyCell = tableTypes.cell.createAndFill()); }
      else { addedNode = emptyHeader || (emptyHeader = tableTypes.header_cell.createAndFill()); }

      for(let i = map.width; i < width; i++) {
        if(addedNode) {
          cells.push(addedNode);
        } /* else -- do not add */
      }

      tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1 + start), cells);
    }
  } /* else -- no need to adjust width */

  if(height > map.height) {
    const cells: ProseMirrorNode[] = [];
    for(let i = 0, start = (map.height - 1) * map.width; i < Math.max(map.width, width); i++) {
      const addHeaderCellNode = i >= map.width ? false : table.nodeAt(map.map[start + i])?.type === tableTypes[NodeName.HEADER_CELL];

      if(addHeaderCellNode) {
        if(emptyHeader) { cells.push(emptyHeader); }
        else {
          emptyHeader = tableTypes[NodeName.HEADER_CELL].createAndFill();
          if(emptyHeader) {
            cells.push(emptyHeader);
          } /* else -- could not create, nothing to add */
        }
      } else {
        if(emptyCell) { cells.push(emptyCell); }
        else {
          emptyCell = tableTypes[NodeName.CELL].createAndFill();
          if(emptyCell) {
            cells.push(emptyCell);
          } /* else -- could not create, nothing to add */
        }
      }
    }

    const emptyRow = tableTypes[NodeName.ROW].create(null/*no attrs*/, Fragment.from(cells));
    const rows = [];
    for(let i = map.height; i < height; i++) {
      rows.push(emptyRow);
    }

    tr.insert(tr.mapping.slice(mapFrom).map(start + table.nodeSize - 2), rows);
  } /* else -- no need to adjust height */


  return !!(emptyCell || emptyHeader);
};

// make sure the given line (left, top) to (left, bottom) does not
// cross any colSpan Cells by splitting Cells that cross it. Return
// true if something changed
const isolateVertical = (tr: Transaction, map: TableMap, table: ProseMirrorNode, start: number, top: number, bottom: number, left: number, mapFrom: number) => {
  if(left === 0 || left === map.width) return false/*nothing to do*/;

  let found = false/*default*/;
  for(let row = top; row < bottom; row++) {
    const index = row * map.width + left;
    const pos = map.map[index];

    if(map.map[index - 1] == pos) {
      found = true;
      const cell = table.nodeAt(pos);
      if(!cell) continue/*Cell does not exist, nothing to do*/;

      const cellLeft = map.colCount(pos);
      const updatePos = tr.mapping.slice(mapFrom).map(pos + start);

      tr.setNodeMarkup(updatePos, null/*maintain type*/, removeColSpan( cell.attrs, left - cellLeft, cell.attrs[AttributeType.ColSpan] - (left - cellLeft)));

      const newCell = cell.type.createAndFill(removeColSpan(cell.attrs, 0, left - cellLeft));
      if(!newCell) continue/*could not create Cell, do nothing*/;

      tr.insert(updatePos + cell.nodeSize, newCell);
      row += cell.attrs[AttributeType.RowSpan] - 1;
    }
  }

  return found;
};

// make sure that the given line (left, top) to (right, top) does not
// cross any rowSpan Cells by splitting Cells that cross it. Return
// true if something changed
const isolateHorizontal = (tr: Transaction, map: TableMap, table: ProseMirrorNode, start: number, left: number, right: number, top: number, mapFrom: number) => {
  if(top === 0 || top === map.height) return false/*nothing to do*/;

  let found = false/*default*/;
  for(let col = left; col < right; col++) {
    const index = top * map.width + col;
    const pos = map.map[index];

    if(map.map[index - map.width] === pos) {
      found = true;
      const cell = table.nodeAt(pos);
      if(!cell) continue/*Cell does not exist, nothing to do*/;

      const { top: cellTop, left: cellLeft } = map.findCell(pos);
      tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + start), null/*maintain type*/, setTableNodeAttributes(cell.attrs, AttributeType.RowSpan, top - cellTop));

      const newCell = cell.type.createAndFill(setTableNodeAttributes(cell.attrs, AttributeType.RowSpan, cellTop + cell.attrs[AttributeType.RowSpan] - top));
      if(!newCell) continue/*could not create Cell, do nothing*/;

      tr.insert(tr.mapping.slice(mapFrom).map(map.positionAt(top, cellLeft, table)), newCell);

      col += cell.attrs[AttributeType.ColSpan] - 1;
    } /* else -- no need to change anything */
  }

  return found;
};

/**
 * compute the width and height of a set of Cells and make sure each Row
 * has the same number of Cells
 */
 const ensureRectangular = (schema: Schema, rows: Fragment[]) => {
  const widths: number[] = [];
  for(let i = 0; i < rows.length; i++) {
    const row = rows[i];

    for(let j = row.childCount - 1; j >= 0; j--) {
      const colSpan = row.child(j).attrs[AttributeType.ColSpan];
      const rowSpan = row.child(j).attrs[AttributeType.RowSpan];

      for(let r = i; r < i + rowSpan; r++) {
        widths[r] = (widths[r] || 0) + colSpan;
      }
    }
  }

  let width = 0;
  for(let r = 0; r < widths.length; r++) {
    width = Math.max(width, widths[r]);
  }

  for(let r = 0; r < widths.length; r++) {
    if(r >= rows.length) {
      rows.push(Fragment.empty);
    } /* else -- not bigger than the length of the rows array */

    if(widths[r] < width) {
      const emptyCell = getTableNodeTypes(schema)[NodeName.CELL].createAndFill();
      const cells: ProseMirrorNode[] = [];

      for(let i = widths[r]; i < width; i++) {
        if(emptyCell) {
          cells.push(emptyCell);
        } /* else -- could not create empty Cell, do nothing */
      }

      rows[r] = rows[r].append(Fragment.from(cells));
    } /* else -- row width is not smaller than width, no need to change */
  }

  return { height: rows.length, width, rows };
};

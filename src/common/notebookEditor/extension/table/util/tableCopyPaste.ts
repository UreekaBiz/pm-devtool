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
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/copypaste.js

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
export type PastedCellsReturnType = { height: number; width: number; rows: Fragment[]; } | null;
export const pastedCells = (slice: Slice): PastedCellsReturnType => {
  if(!slice.size) return null/*empty slice, nothing to do*/;

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
  const pastedRows = [/*default empty*/];

  if(firstChildRole === TableRole.Row) {
    for(let i = 0; i < content.childCount; i++) {
      let pastedCells = content.child(i).content;
      const sliceOpenStart = i ? 0/*default*/ : Math.max(0, openStart - 1);
      const sliceOpenEnd = i < content.childCount - 1 ? 0/*default*/ : Math.max(0, openEnd - 1);
      if(sliceOpenStart || sliceOpenEnd) {
        pastedCells = fitSlice(getTableNodeTypes(schema)[NodeName.ROW], new Slice(pastedCells, sliceOpenStart, sliceOpenEnd)).content;
      } /* else -- both left and right are 0 */

      pastedRows.push(pastedCells);
    }
  } else if(firstChildRole === TableRole.Cell || firstChildRole === TableRole.HeaderCell) {
    pastedRows.push(openStart || openEnd ? fitSlice(getTableNodeTypes(schema)[NodeName.ROW], new Slice(content, openStart, openEnd)).content : content);
  } else {
    return null/*nothing to do*/;
  }

  return ensureRectangular(schema, pastedRows);
};

// insert the given Cells (as returned by 'pastedCells') into a Table
// at the position pointed at by the given rect
export const insertCells = (state: EditorState, dispatch: DispatchType, tableStart: number, rect: TableRect, cells: { height: number; width: number; rows: Fragment[];}) => {
  let table = tableStart ? state.doc.nodeAt(tableStart - 1/*the Table itself*/) : state.doc;
  if(!table) return/*nothing to do*/;

  let tableMap = TableMap.get(table);
  const { top, left } = rect,
        right = left + cells.width,
        bottom = top + cells.height;

  const tr = state.tr;
  let mapFrom = 0/*default*/;
  const recomputeTableMap = () => {
    table = tableStart ? tr.doc.nodeAt(tableStart - 1/*the Table itself*/) : tr.doc;
    if(!table) return/*nothing to do*/;

    tableMap = TableMap.get(table);
    mapFrom = tr.mapping.maps.length;
  };

  // modify the Table to be large enough and not have Cells crossing boundaries
  // of the TableRect they will be inserted into. Recompute the TableMap
  // when something changes
  if(growTable(tr, tableMap, table, tableStart, right, bottom, mapFrom)) {
    recomputeTableMap();
  } /* else -- no need to growTable */

  if(isolateHorizontal(tr, table, tableMap, tableStart, left, right, top, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate horizontally */

  if(isolateHorizontal(tr, table, tableMap, tableStart, left, right, bottom, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate horizontally */

  if(isolateVertical(tr, table, tableMap, tableStart, top, bottom, left, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate vertically */

  if(isolateVertical(tr, table, tableMap, tableStart, top, bottom, right, mapFrom)) {
    recomputeTableMap();
  } /* else -- did not need to isolate vertically */

  for(let row = top; row < bottom; row++) {
    const from = tableMap.positionAt(row, left, table),
          to = tableMap.positionAt(row, right, table);
    tr.replace(tr.mapping.slice(mapFrom).map(from + tableStart), tr.mapping.slice(mapFrom).map(to + tableStart), new Slice(cells.rows[row - top], 0/*use full Slice*/, 0/*use full Slice*/));
  }

  recomputeTableMap();
  tr.setSelection(new CellSelection(tr.doc.resolve(tableStart + tableMap.positionAt(top, left, table)), tr.doc.resolve(tableStart + tableMap.positionAt(bottom - 1/*account for 0 indexing*/, right - 1/*account for 0 indexing*/, table))));

  if(dispatch) {
    dispatch(tr);
  } /* else -- do not dispatch the Transaction */
};

/**
 * clip or (repeat) the given Cells to cover the given
 * width and height. Will Cells at the edges if required
 */
 export const clipCells = ({ width, height, rows }: { width: number; height: number; rows: Fragment[]; }, newWidth: number, newHeight: number) => {
  if(width !== newWidth) {
    const addedCellPositions: number[] = [];
    const newRows = [/*default empty*/];

    for(let row = 0; row < rows.length; row++) {
      const fragment = rows[row];
      const cells = [/*default empty*/];

      for(let col = addedCellPositions[row] || 0, i = 0; col < newWidth; i++) {
        let cell = fragment.child(i % fragment.childCount);
        if(col + cell.attrs[AttributeType.ColSpan] > newWidth) {
          cell = cell.type.create(removeColSpan( cell.attrs, cell.attrs[AttributeType.ColSpan], col + cell.attrs[AttributeType.ColSpan] - newWidth), cell.content);
        } /* else -- no need to recreate Cell */

        cells.push(cell);
        col += cell.attrs[AttributeType.ColSpan];

        for(let j = 1; j < cell.attrs[AttributeType.RowSpan]; j++) {
          addedCellPositions[row + j] = (addedCellPositions[row + j] || 0) + cell.attrs[AttributeType.ColSpan];
        }
      }
      newRows.push(Fragment.from(cells));
    }
    rows = newRows;
    width = newWidth;
  }

  if(height !== newHeight) {
    const newRows = [/*default empty*/];
    for(let row = 0, i = 0; row < newHeight; row++, i++) {
      const cells = [/*default empty*/];
      const sourceCell = rows[i % height];

      for(let j = 0; j < sourceCell.childCount; j++) {
        let cell = sourceCell.child(j);
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
// ensure that a Table has the given width and height
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

      if(rowNode.lastChild == null || rowNode.lastChild.type == tableTypes[NodeName.CELL]) { addedNode = emptyCell || (emptyCell = tableTypes[NodeName.CELL].createAndFill()); }
      else { addedNode = emptyHeader || (emptyHeader = tableTypes[NodeName.HEADER_CELL].createAndFill()); }

      for(let i = map.width; i < width; i++) {
        if(addedNode) {
          cells.push(addedNode);
        } /* else -- do not add */
      }

      tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1/*inside it*/ + start), cells);
    }
  } /* else -- no need to adjust width */

  if(height > map.height) {
    const cells: ProseMirrorNode[] = [/*default empty*/];
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
    const rows = [/*default empty*/];
    for(let i = map.height; i < height; i++) {
      rows.push(emptyRow);
    }

    tr.insert(tr.mapping.slice(mapFrom).map(start + table.nodeSize - 2/*account for start and end*/), rows);
  } /* else -- no need to adjust height */

  // return true if something changed
  return !!(emptyCell || emptyHeader);
};

// ensure the line going from (left, top) to (left, bottom) does not
// cross column spanning Cells by splitting those that do
const isolateVertical = (tr: Transaction, table: ProseMirrorNode, tableMap: TableMap, start: number, top: number, bottom: number, left: number, mapFrom: number) => {
  if(left === 0 || left === tableMap.width) return false/*nothing to do*/;

  let isolatedCellsVertically = false/*default*/;
  for(let row = top; row < bottom; row++) {
    const index = row * tableMap.width + left;
    const pos = tableMap.map[index];

    if(tableMap.map[index - 1] === pos) {
      isolatedCellsVertically = true;
      const cell = table.nodeAt(pos);
      if(!cell) continue/*Cell does not exist, nothing to do*/;

      const cellLeft = tableMap.colCount(pos);
      const updatePos = tr.mapping.slice(mapFrom).map(pos + start);

      tr.setNodeMarkup(updatePos, null/*maintain type*/, removeColSpan( cell.attrs, left - cellLeft, cell.attrs[AttributeType.ColSpan] - (left - cellLeft)));

      const newCell = cell.type.createAndFill(removeColSpan(cell.attrs, 0, left - cellLeft));
      if(!newCell) continue/*could not create Cell, do nothing*/;

      tr.insert(updatePos + cell.nodeSize, newCell);
      row += cell.attrs[AttributeType.RowSpan] - 1;
    }
  }

  return isolatedCellsVertically;
};

// ensure the line going from (left, top) to (right, top) does not
// cross row spanning Cells by splitting those that do
const isolateHorizontal = (tr: Transaction, table: ProseMirrorNode, tableMap: TableMap, start: number, left: number, right: number, top: number, mapFrom: number) => {
  if(top === 0 || top === tableMap.height) return false/*nothing to do*/;

  let isolatedCellsHorizontally = false/*default*/;
  for(let col = left; col < right; col++) {
    const cellPosIndex = top * tableMap.width + col;
    const cellPos = tableMap.map[cellPosIndex];

    if(tableMap.map[cellPosIndex - tableMap.width] === cellPos) {
      isolatedCellsHorizontally = true;
      const cell = table.nodeAt(cellPos);
      if(!cell) continue/*Cell does not exist, nothing to do*/;

      const { top: cellTop, left: cellLeft } = tableMap.findCell(cellPos);
      tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(cellPos + start), null/*maintain type*/, setTableNodeAttributes(cell.attrs, AttributeType.RowSpan, top - cellTop));

      const newCell = cell.type.createAndFill(setTableNodeAttributes(cell.attrs, AttributeType.RowSpan, cellTop + cell.attrs[AttributeType.RowSpan] - top));
      if(!newCell) continue/*could not create Cell, do nothing*/;

      tr.insert(tr.mapping.slice(mapFrom).map(tableMap.positionAt(top, cellLeft, table)), newCell);

      col += cell.attrs[AttributeType.ColSpan] - 1;
    } /* else -- no need to change anything */
  }

  return isolatedCellsHorizontally;
};

/**
 * compute the width and height of the given Cells, ensuring that Rows
 * have the same number of them
 */
 const ensureRectangular = (schema: Schema, rows: Fragment[]) => {
  const rowWidths: number[] = [];
  for(let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    for(let rowChildIndex = row.childCount - 1; rowChildIndex >= 0; rowChildIndex--) {
      const colSpan = row.child(rowChildIndex).attrs[AttributeType.ColSpan];
      const rowSpan = row.child(rowChildIndex).attrs[AttributeType.RowSpan];

      for(let rowWidthIndex = rowIndex; rowWidthIndex < rowIndex + rowSpan; rowWidthIndex++) {
        rowWidths[rowWidthIndex] = (rowWidths[rowWidthIndex] || 0) + colSpan;
      }
    }
  }

  let maxWidth = 0/*default*/;
  for(let rowWidthIndex = 0; rowWidthIndex < rowWidths.length; rowWidthIndex++) {
    maxWidth = Math.max(maxWidth, rowWidths[rowWidthIndex]);
  }

  for(let rowIndex = 0; rowIndex < rowWidths.length; rowIndex++) {
    if(rowIndex >= rows.length) {
      rows.push(Fragment.empty);
    } /* else -- not bigger than the length of the rows array */

    if(rowWidths[rowIndex] < maxWidth) {
      const emptyCell = getTableNodeTypes(schema)[NodeName.CELL].createAndFill();
      const cells: ProseMirrorNode[] = [/*default empty*/];

      for(let i = rowWidths[rowIndex]; i < maxWidth; i++) {
        if(emptyCell) {
          cells.push(emptyCell);
        } /* else -- could not create empty Cell, do nothing */
      }

      rows[rowIndex] = rows[rowIndex].append(Fragment.from(cells));
    } /* else -- row width is not smaller than width, no need to change */
  }

  return { height: rows.length, width: maxWidth, rows };
};

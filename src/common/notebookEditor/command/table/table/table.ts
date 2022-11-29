import { Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';
import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { NodeName } from '../../../../notebookEditor/node';
import { findParentNodeClosestToPos } from '../../../../notebookEditor/node/util';
import { isAllBlockNodeRangeSelected, isCellSelection } from '../../../../notebookEditor/selection';
import { isNotNullOrUndefined } from '../../../../util/object';
import { CellSelection, TableMap } from '../../../extension/table/class';
import { isCellNode } from '../../..//extension/table/node/cell';
import { isHeaderCellNode } from '../../../extension/table/node/headerCell';
import { getTableNodeTypes, isTableNode, TABLE_DEFAULT_COLUMNS, TABLE_DEFAULT_ROWS, TABLE_DEFAULT_WITH_HEDER_ROW } from '../../../extension/table/node/table';
import { TableRole } from '../../../extension/table/type';
import { addColumnSpans, isColumnHeader, isSelectionHeadInRow, removeColumnSpans, getSelectedTableRect, updateTableNodeAttributes, getResolvedCellPosAroundResolvedPos } from '../../..//extension/table/util';
import { AbstractDocumentUpdate } from '../../type';

import { createTable } from './util';

// ********************************************************************************
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/commands.js

// == Type ========================================================================
type OptionalRectProps = { table: ProseMirrorNode | null | undefined; tableMap: TableMap | null | undefined; tableStart: number | null | undefined; };

// == Table =======================================================================
/** create and insert a Table Node */
export const createAndInsertTableCommand = (rows=TABLE_DEFAULT_ROWS, columns=TABLE_DEFAULT_COLUMNS, withHeaderRow=TABLE_DEFAULT_WITH_HEDER_ROW): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new CreateAndInsertTableDocumentUpdate(rows, columns, withHeaderRow), state, dispatch);
export class CreateAndInsertTableDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly rows: number, private readonly columns: number, private readonly withHeaderRow: boolean) {/*nothing additional*/ }

  /**
   *  modify the given Transaction such
   * that a Table Node is created and inserted
   */
  public update(editorState: EditorState, tr: Transaction) {
    const tableNode = createTable(editorState.schema, this.rows, this.columns, this.withHeaderRow);
    const { $from, from } = tr.selection;

    if($from.parent.isTextblock && !$from.parent.content.size/*empty*/) {
      const parentStart = from - $from.parentOffset - 1/*the position of the parent*/,
            parentEnd = parentStart + $from.parent.nodeSize;
      tr.replaceRangeWith(parentStart, parentEnd, tableNode);
    } else {
      tr.replaceSelectionWith(tableNode);
    }

    tr.setSelection(Selection.near(tr.doc.resolve(from), 1/*bias to the right*/))
      .scrollIntoView();
    return tr/*updated*/;
  }
}
/** deletes the Table around the Selection, if any */
export const deleteTableCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new DeleteTableDocumentUpdate(), state, dispatch);
export class DeleteTableDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  public update(editorState: EditorState, tr: Transaction) {
    const $pos = editorState.selection.$anchor;

    for(let depth = $pos.depth; depth > 0; depth--) {
      const nodeAtDepth = $pos.node(depth);
      if(nodeAtDepth.type.spec.tableRole === TableRole.Table) {
        tr.delete($pos.before(depth), $pos.after(depth)).scrollIntoView();
      } /* else -- not a Table, do nothing */
    }

    return tr/*updated*/;
  }
}

/** delete a Table if all its Cells are currently selected */
export const deleteTableWhenAllCellsSelectedCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new DeleteTableWhenAllCellsSelectedDocumentUpdate(), state, dispatch);
export class DeleteTableWhenAllCellsSelectedDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  public update(editorState: EditorState, tr: Transaction){
    const { selection } = editorState;
    if(!isCellSelection(selection)) return false/*not a CellSelection, nothing to do*/;

    let cellCount = 0/*default*/;
    const tableParentObj = findParentNodeClosestToPos(selection.ranges[0/*first range*/].$from, (node) => isTableNode(node));
    if(!tableParentObj) return false/*Table does not exits*/;

    tableParentObj.node.descendants((node) => {
      if(isTableNode(node)) return false/*do not descend further*/;

      if(isHeaderCellNode(node) || isCellNode(node)) {
        cellCount += 1;
      } /* else -- ignore */

      return true/*keep descending*/;
    });

    const allCellsSelected = cellCount === selection.ranges.length;
    if(!allCellsSelected) return false/*nothing to do*/;

    const updatedTr = new DeleteTableDocumentUpdate().update(editorState, tr);
    return updatedTr;
  }
}

export const selectAllInsideTableCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SelectAllInsideTableDocumentUpdate(), state, dispatch);
export class SelectAllInsideTableDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction) {
    if(!isAllBlockNodeRangeSelected(editorState.selection)) return false/*not all the Content of the current Block is selected*/;

    // if there is no CellSelection, select the current Cell
    const $currentCellPos = getResolvedCellPosAroundResolvedPos(tr.doc.resolve(tr.selection.from));
    if(!$currentCellPos) return false/*no Cell to select*/;
    if(!isCellSelection(editorState.selection)) {
      return tr.setSelection(new CellSelection($currentCellPos))/*updated*/;
    }  /* else -- there already is a CellSelection */

    // if the whole Table is not currently selected, select it
    const selectAllTableUpdatedTr = selectAllTable(editorState, tr, $currentCellPos);
    if(selectAllTableUpdatedTr) {
      return selectAllTableUpdatedTr/*updated*/;
    } /* else -- all the table is already selected */

    return false/*default*/;
  }
}
/* select the whole Table if it is not currently selected */
const selectAllTable = (editorState: EditorState, tr: Transaction, $currentCellPos: ResolvedPos) => {
  const table = $currentCellPos.node(-1/*grandParent*/);
  if(!table || !isTableNode(table)) return false/*no Table to select*/;
  const tableMap = TableMap.getTableMap(table),
        tableStart = $currentCellPos.start(-1/*grandParent depth*/);

  const firstCellPos = tableStart + tableMap.map[0/*first cell*/],
        lastCellPos = tableStart + tableMap.map[tableMap.map.length-1/*the last Cell*/];
  const firstCell = tr.doc.nodeAt(firstCellPos),
        lastCell = tr.doc.nodeAt(lastCellPos);
  if(!firstCell || !lastCell || !firstCell.type.spec.tableRole || !lastCell.type.spec.tableRole) return false/*no Cells at the given positions*/;

  const $firstCellPos = getResolvedCellPosAroundResolvedPos(tr.doc.resolve(firstCellPos+1/*inside the Cell*/)),
        $lastCellPos = getResolvedCellPosAroundResolvedPos(tr.doc.resolve(lastCellPos+1/*inside the Cell*/));
  if(!$firstCellPos || !$lastCellPos) return false/*no Cells to select*/;

  const { anchor, head } = editorState.selection,
        allTableAlreadySelected = $firstCellPos.pos === anchor && $lastCellPos.pos === head;
  if(!allTableAlreadySelected) {
    return tr.setSelection(new CellSelection($firstCellPos, $lastCellPos))/*updated*/;
  } /* else -- all the Table is already selected */

  return false/*do not select all Table*/;
};

// == Row =========================================================================
/** add a Table Row before the Selection */
export const addRowBeforeCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddRowBeforeDocumentUpdate(), state, dispatch);
export class AddRowBeforeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such
   * a Table Row is added before the Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no selected TableRect in Table*/;

    const updatedTr = addRow(tr, tableRect, tableRect.top);
    return updatedTr/*updated*/;
  }
}

/** add a Table Row after the Selection */
export const addRowAfterCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddRowAfterDocumentUpdate(), state, dispatch);
export class AddRowAfterDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such
   * a Table Row is added after the Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no TableRect in Table*/;

    const updatedTr = addRow(tr, tableRect, tableRect.bottom);
    return updatedTr/*updated*/;
  }
}

/** remove the selected Rows from a Table */
export const deleteRowCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new DeleteRowDocumentUpdate(), state, dispatch);
export class DeleteRowDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that
   * the selected Rows are removed from a Table
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no TableRect in Table*/;

    const { table, tableMap } = tableRect;
    if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap)) return false/*do nothing*/;
    if(tableRect.top === 0 && tableRect.bottom === tableMap.height) return false/*nothing to do*/;

    for(let i = tableRect.bottom - 1; ; i--) {
      removeRow(tr, tableRect, i);
      if(i === tableRect.top) break/*nothing left to do*/;

      tableRect.table = tableRect.tableStart
        ? tr.doc.nodeAt(tableRect.tableStart - 1)
        : tr.doc;
      if(!tableRect.table) break/*nothing to do */;

      tableRect.tableMap = TableMap.getTableMap(tableRect.table);
    }

    return tr/*updated*/;
  }
}

/** check if the row at the given rowIndex is a HeaderCell  */
const isRowHeader = (table: ProseMirrorNode, tableMap: TableMap, rowIndex: number) => {
  const headerCellType = getTableNodeTypes(table.type.schema)[NodeName.HEADER_CELL];

  for(let columnIndex = 0; columnIndex < tableMap.width; columnIndex++) {
    const cellAt = table.nodeAt(tableMap.map[columnIndex + rowIndex * tableMap.width]);
    if(!cellAt) return false/*by definition*/;

    if(!(cellAt.type === headerCellType)) return false/*not a header Cell*/;
  }

  return true/*row is Header*/;
};

/** add a row below or above the one at the given rowNumber */
const addRow = (tr: Transaction, { tableMap, tableStart, table }: OptionalRectProps, rowNumber: number) => {
  if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return tr/*do nothing*/;

  let newRowInsertionPos: number | null | undefined = tableStart/*default*/;
  for(let i = 0; i < rowNumber; i++) {
    newRowInsertionPos += table.child(i).nodeSize;
  }

  const newRowCells: ProseMirrorNode[] = [/*default empty*/];
  let referenceRowNumber: number | null = rowNumber > 0 ? -1/*not adding at the first row of the Table*/ : 0/*adding at the first row of the Table*/;
  if(isRowHeader(table, tableMap, rowNumber + referenceRowNumber)) {
    referenceRowNumber = rowNumber === 0 || rowNumber === tableMap.height/*adding at end*/ ? null : 0/*default*/;
  } /* else -- row is not a Header */

  for(let columnIndex = 0, mapIndex = tableMap.width * rowNumber; columnIndex < tableMap.width; columnIndex++, mapIndex++) {
    // covered by a rowSpan Cell
    if(rowNumber > 0 && rowNumber < tableMap.height && tableMap.map[mapIndex] === tableMap.map[mapIndex - tableMap.width]) {
      const cellPos = tableMap.map[mapIndex];
      const cellNode = table.nodeAt(cellPos);
      if(!cellNode) continue/*nothing to do*/;

      const { attrs } = cellNode;
      tr.setNodeMarkup(tableStart + cellPos, null/*maintain type*/, updateTableNodeAttributes(attrs, AttributeType.RowSpan, attrs[AttributeType.RowSpan] + 1));
      columnIndex += attrs[AttributeType.ColSpan] - 1;
    } else {
      const type =
        referenceRowNumber == null
          ? getTableNodeTypes(table.type.schema)[NodeName.CELL]/*default*/
          : table.nodeAt(tableMap.map[mapIndex + referenceRowNumber * tableMap.width])?.type/*type of the referenced Row*/;

      if(type) {
        const nodeOfType = type.createAndFill();
        if(!nodeOfType) continue/*could not create, nothing to do*/;

        newRowCells.push(nodeOfType);
      } /* else -- no type to create */
    }
  }
  tr.insert(newRowInsertionPos, getTableNodeTypes(table.type.schema)[NodeName.ROW].create(null/*no attrs*/, newRowCells));
  return tr;
};

/** remove a row below or above the one at the given rowNumber */
const removeRow = (tr: Transaction, { tableMap, table, tableStart }: OptionalRectProps, rowNumber: number) => {
  if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return/*do nothing*/;

  let deletedRowPos = 0;
  for(let i = 0; i < rowNumber; i++) {
    deletedRowPos += table.child(i).nodeSize;
  }

  const nextRow = deletedRowPos + table.child(rowNumber).nodeSize;
  const mapFrom = tr.mapping.maps.length;
  tr.delete(deletedRowPos + tableStart, nextRow + tableStart);

  for(let column = 0, mapIndex = rowNumber * tableMap.width; column < tableMap.width; column++, mapIndex++) {
    const cellPos = tableMap.map[mapIndex];
    if(rowNumber > 0 && cellPos == tableMap.map[mapIndex - tableMap.width]) {
      // reduce the rowSpan of the Cell above if it exists
      const cell = table.nodeAt(cellPos);
      if(!cell) continue/*nothing to do*/;

      const { attrs } = cell;
      tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(cellPos + tableStart), null/*maintain type*/, updateTableNodeAttributes(attrs, AttributeType.RowSpan, attrs[AttributeType.RowSpan] - 1));
      column += attrs[AttributeType.ColSpan] - 1;

    } else if(rowNumber < tableMap.width && cellPos == tableMap.map[mapIndex + tableMap.width]) {
      // move the Cell down if it continues in the Row below
      const cell = table.nodeAt(cellPos);
      if(!cell) continue/*nothing to do*/;

      const { attrs } = cell;
      const cellCopy = cell.type.create(updateTableNodeAttributes(attrs, AttributeType.RowSpan, cell.attrs[AttributeType.RowSpan] - 1), cell.content);

      const newPos = tableMap.cellPositionAt(table, rowNumber + 1, column);
      tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), cellCopy);
      column += cell.attrs[AttributeType.ColSpan] - 1;
    } /* else -- do nothing */
  }
};

// == Column ======================================================================
/** add a column before the column with the current Selection */
export const addColumnBeforeCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddColumnBeforeDocumentUpdate(), state, dispatch);
export class AddColumnBeforeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that a column is added
   * before the column with the current Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no selected TableRect in Table*/;

    const updatedTr = addColumn(tr, tableRect, tableRect.left);
    return updatedTr;
  }
}

/** add a column after the column with the current Selection */
export const addColumnAfterCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddColumnAfterDocumentUpdate(), state, dispatch);
export class AddColumnAfterDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that a column is added
   * after the column with the current Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no selected TableRect in Table*/;

    const updatedTr = addColumn(tr, tableRect, tableRect.right);
    return updatedTr;
  }
}


/** remove the selected columns from a Table */
export const deleteColumnCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new DeleteColumnDocumentUpdate(), state, dispatch);
export class DeleteColumnDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that the selected Columns
   * are removed from a Table */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no selected Rectangle in Table*/;

    const { table, tableMap, tableStart } = tableRect;
    if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return false/*do nothing*/;
    if(tableRect.left === 0 && tableRect.right === tableMap.width) return false/*do nothing*/;

    for(let i = tableRect.right - 1; ; i--) {
      removeColumn(tr, tableRect, i);
      if(i === tableRect.left) break/*nothing left to do*/;

      tableRect.table = tableRect.tableStart ? tr.doc.nodeAt(tableRect.tableStart - 1) : tr.doc;
      if(!tableRect.table) return false/*Table does not exist*/;

      tableRect.tableMap = TableMap.getTableMap(tableRect.table);
    }

    return tr/*updated*/;
  }
}

/**
 * add a Column to the left or the right of the one at the
 * given columnNumber in a Table Node
 */
const addColumn = (tr: Transaction, { table, tableMap, tableStart }: OptionalRectProps, columnNumber: number) => {
  if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return tr/*do nothing*/;

  let referenceColumn: number | null = columnNumber > 0 ? -1/*not adding at the first column of the Table*/ : 0/*adding at the first column of the Table*/;
  if(isColumnHeader(table, tableMap, columnNumber + referenceColumn)) {
    referenceColumn = (columnNumber === 0 || columnNumber === tableMap.width/*adding at end*/) ? null : 0/*default*/;
  } /* else -- computed column is not a Header */

  for(let row = 0; row < tableMap.height; row++) {
    const mapIndex = row * tableMap.width + columnNumber;

    // if the position falls inside a column spanning Cell
    if(columnNumber > 0 && columnNumber < tableMap.width && tableMap.map[mapIndex - 1] === tableMap.map[mapIndex]) {
      let cellPos = tableMap.map[mapIndex];
      const cellNode = table.nodeAt(cellPos);
      if(!cellNode) continue/*nothing to do*/;

      tr.setNodeMarkup(tr.mapping.map(tableStart + cellPos), null/*maintain type*/, addColumnSpans(cellNode.attrs, columnNumber - tableMap.getColumnAmountBeforePos(cellPos)));

      // skip if rowSpan > 1
      row += cellNode.attrs[AttributeType.RowSpan] - 1;
    } else {
      const cellType =
        referenceColumn === null
          ? getTableNodeTypes(table.type.schema)[NodeName.CELL]
          : table.nodeAt(tableMap.map[mapIndex + referenceColumn])?.type;

      const mappedPos = tableMap.cellPositionAt(table, row, columnNumber);
      const cellOfType = cellType?.createAndFill();

      if(cellOfType) {
        tr.insert(tr.mapping.map(tableStart + mappedPos), cellOfType);
      } /* else -- could not create Node, do not insert anything */
    }
  }

  return tr;
};

/**
 * remove a Column to the left or the right of the one at the
 * given columnNumber in a Table Node
 */
const removeColumn = (tr: Transaction, { table, tableMap, tableStart }: OptionalRectProps, columnNumber: number) => {
  if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return/*do nothing*/;

  const mapStart = tr.mapping.maps.length;
  for(let row = 0; row < tableMap.height;) {
    const mapIndex = row * tableMap.width + columnNumber;
    const cellPos = tableMap.map[mapIndex];

    const cellNode = table.nodeAt(cellPos);
    if(!cellNode) continue/*nothing to do*/;

    // if this is part of a column spanning Cell
    if((columnNumber > 0 && tableMap.map[mapIndex - 1] === cellPos) || (columnNumber < tableMap.width - 1 && tableMap.map[mapIndex + 1] === cellPos)) {
      tr.setNodeMarkup(tr.mapping.slice(mapStart).map(tableStart + cellPos), null/*maintain type*/, removeColumnSpans(cellNode.attrs, columnNumber - tableMap.getColumnAmountBeforePos(cellPos)));
    } else {
      const start = tr.mapping.slice(mapStart).map(tableStart + cellPos);
      tr.delete(start, start + cellNode.nodeSize);
    }
    row += cellNode.attrs[AttributeType.RowSpan];
  }
};

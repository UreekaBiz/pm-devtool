import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Command, EditorState, TextSelection, Transaction } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { NodeName } from '../../../../notebookEditor/node';
import { findParentNodeClosestToPos } from '../../../../notebookEditor/node/util';
import { isCellSelection } from '../../../../notebookEditor/selection';
import { isNotNullOrUndefined } from '../../../../util/object';
import { TableMap } from '../../../extension/table/class';
import { isCellNode } from '../../..//extension/table/node/cell';
import { isHeaderCellNode } from '../../../extension/table/node/headerCell';
import { getTableNodeTypes, isTableNode, TABLE_DEFAULT_COLUMNS, TABLE_DEFAULT_ROWS, TABLE_DEFAULT_WITH_HEDER_ROW } from '../../../extension/table/node/table';
import { TableRole } from '../../../extension/table/type';
import { addColSpan, columnIsHeader, isInTable, removeColSpan, selectedRect, setTableNodeAttributes } from '../../..//extension/table/util';
import { AbstractDocumentUpdate, DispatchType } from '../../type';

import { createTable } from './util';

// ********************************************************************************
// == Type ========================================================================
type OptionalRectProps = { table: ProseMirrorNode | null | undefined; tableMap: TableMap | null | undefined; tableStart: number | null | undefined; };

// == Table =======================================================================
/** create and insert a Table Node */
export const createAndInsertTableCommand = (rows=TABLE_DEFAULT_ROWS, columns=TABLE_DEFAULT_COLUMNS, withHeaderRow=TABLE_DEFAULT_WITH_HEDER_ROW): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new CreateAndInsertTableDocumentUpdate(rows, columns, withHeaderRow).update(state, state.tr), dispatch);
export class CreateAndInsertTableDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly rows: number, private readonly columns: number, private readonly withHeaderRow: boolean) {/*nothing additional*/ }

  /**
   *  modify the given Transaction such
   * that a Table Node is created and inserted
   */
  public update(editorState: EditorState, tr: Transaction) {
    const node = createTable(editorState.schema, this.rows, this.columns, this.withHeaderRow);
    const offset = tr.selection.anchor + 1/*inside the table*/;

    tr.replaceSelectionWith(node)
      .scrollIntoView()
      .setSelection(TextSelection.near(tr.doc.resolve(offset)));

    return tr/*updated*/;
  }
}
/** deletes the Table around the Selection, if any */
export const deleteTable = (state: EditorState, dispatch: DispatchType) => {
  const $pos = state.selection.$anchor;

  for(let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if(node.type.spec.tableRole === TableRole.Table) {
      if(dispatch)
        dispatch(state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView());
      return true/*handled*/;
    } /* else -- not a Table, do nothing */
  }

  return false/*not handled*/;
};

/** delete a Table if all its Cells are currently selected */
export const deleteTableWhenAllCellsSelected: Command = (state, dispatch) => {
  const { selection } = state;

  if(!isCellSelection(selection)) {
    return false;
  } /* else -- see if all Cells are selected */

  let cellCount = 0;
  const table = findParentNodeClosestToPos(selection.ranges[0/*first range*/].$from, (node) => isTableNode(node));
  if(!table) return false/*Table does not exits*/;

  table.node.descendants((node) => {
    if(isTableNode(node)) return false/*do not descend further*/;

    if(isHeaderCellNode(node) || isCellNode(node)) {
      cellCount += 1;
    } /* else -- ignore */

    return true/*keep descending*/;
  });

  const allCellsSelected = cellCount === selection.ranges.length;
  if(!allCellsSelected) return false/*nothing to do*/;

  return deleteTable(state, dispatch);
};

// == Row =========================================================================
/** add a Table Row before the Selection */
export const addRowBeforeCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddRowBeforeDocumentUpdate().update(state, state.tr), dispatch);
export class AddRowBeforeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such
   * a Table Row is added before the Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isInTable(editorState)) return false/*nothing to do*/;

    const rect = selectedRect(editorState);
    if(!rect) return false/*no selected Rectangle in Table*/;

    const updatedTr = addRow(tr, rect, rect.top);
    return updatedTr/*updated*/;
  }
}

/** add a Table Row after the Selection */
export const addRowAfterCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddRowAfterDocumentUpdate().update(state, state.tr), dispatch);
export class AddRowAfterDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such
   * a Table Row is added after the Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isInTable(editorState)) return false/*nothing to do*/;

    const rect = selectedRect(editorState);
    if(!rect) return false/*no selected Rectangle in Table*/;

    const updatedTr = addRow(tr, rect, rect.bottom);
    return updatedTr/*updated*/;
  }
}

/** remove the selected Rows from a Table */
export const deleteRow = (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const rect = selectedRect(state);
    if(!rect || !rect.table || !rect.tableMap) return false/*no selected Rectangle in Table*/;
    if(rect.top === 0 && rect.bottom === rect.tableMap.height) return false/*nothing to do*/;

    const { tr } = state;
    for(let i = rect.bottom - 1; ; i--) {
      removeRow(tr, rect, i);
      if(i === rect.top) break/*nothing left to do*/;

      rect.table = rect.tableStart
        ? tr.doc.nodeAt(rect.tableStart - 1)
        : tr.doc;
      if(!rect.table) break/*nothing to do */;

      rect.tableMap = TableMap.get(rect.table);
    }

    dispatch(tr);
  }

  return true/*handled*/;
};

const rowIsHeader = (map: TableMap, table: ProseMirrorNode, row: number) => {
  const headerCellType = getTableNodeTypes(table.type.schema)[NodeName.HEADER_CELL];

  for(let col = 0; col < map.width; col++) {
    const cellAt = table.nodeAt(map.map[col + row * map.width]);
    if(!cellAt) return false/*by definition*/;

    if(!(cellAt.type === headerCellType)) return false/*not a header Cell*/;
  }

  return true/*row is Header*/;
};

const addRow = (tr: Transaction, { tableMap, tableStart, table }: OptionalRectProps, row: number) => {
  if(!tableMap || !tableStart || !table) return tr/*do nothing*/;

  let rowPos: number | null | undefined = tableStart;
  for(let i = 0; i < row; i++) {
    rowPos += table.child(i).nodeSize;
  }

  const cells: ProseMirrorNode[] = [];
  let refRow: number | null = row > 0 ? -1 : 0;
  if(rowIsHeader(tableMap, table, row + refRow)) {
    refRow = row === 0 || row === tableMap.height ? null : 0;
  } /* else -- row is not a Header */

  for(let col = 0, index = tableMap.width * row; col < tableMap.width; col++, index++) {

    // covered by a rowSpan cell
    if(row > 0 && row < tableMap.height && tableMap.map[index] === tableMap.map[index - tableMap.width]) {
      const pos = tableMap.map[index];
      const node = table.nodeAt(pos);
      if(!node) continue/*nothing to do*/;

      const { attrs } = node;
      tr.setNodeMarkup(tableStart + pos, null/*maintain type*/, setTableNodeAttributes(attrs, AttributeType.RowSpan, attrs[AttributeType.RowSpan] + 1));
      col += attrs[AttributeType.ColSpan] - 1;
    } else {
      const type =
        refRow == null
          ? getTableNodeTypes(table.type.schema)[NodeName.CELL]
          : table.nodeAt(tableMap.map[index + refRow * tableMap.width])?.type;

      if(type) {
        const nodeOfType = type.createAndFill();
        if(!nodeOfType) continue/*could not create, nothing to do*/;

        cells.push(nodeOfType);
      } /* else -- no type to create */
    }
  }
  tr.insert(rowPos, getTableNodeTypes(table.type.schema)[NodeName.ROW].create(null/*no attrs*/, cells));
  return tr;
};

const removeRow = (tr: Transaction, { tableMap, table, tableStart }: OptionalRectProps, row: number) => {
  if(!table || !tableMap || !tableStart) return/*do nothing*/;

  let rowPos = 0;
  for(let i = 0; i < row; i++) {
    rowPos += table.child(i).nodeSize;
  }

  const nextRow = rowPos + table.child(row).nodeSize;
  const mapFrom = tr.mapping.maps.length;

  tr.delete(rowPos + tableStart, nextRow + tableStart);
  for(let col = 0, index = row * tableMap.width; col < tableMap.width; col++, index++) {
    const pos = tableMap.map[index];
    if(row > 0 && pos == tableMap.map[index - tableMap.width]) {
      // if the cell starts in the Row above, reduce its rowSpan
      const cell = table.nodeAt(pos);
      if(!cell) continue/*nothing to do*/;

      const { attrs } = cell;
      tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + tableStart), null/*maintain type*/, setTableNodeAttributes(attrs, AttributeType.RowSpan, attrs[AttributeType.RowSpan] - 1));
      col += attrs[AttributeType.ColSpan] - 1;

    } else if(row < tableMap.width && pos == tableMap.map[index + tableMap.width]) {
      // if it continues in the Row below, it has to be moved down
      const cell = table.nodeAt(pos);
      if(!cell) continue/*nothing to do*/;

      const { attrs } = cell;
      const cellCopy = cell.type.create(setTableNodeAttributes(attrs, AttributeType.RowSpan, cell.attrs[AttributeType.RowSpan] - 1), cell.content);

      const newPos = tableMap.positionAt(row + 1, col, table);
      tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), cellCopy);
      col += cell.attrs[AttributeType.ColSpan] - 1;
    } /* else -- do nothing */
  }
};

// == Column ======================================================================
/** add a column before the column with the current Selection */
export const addColumnBeforeCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddColumnBeforeDocumentUpdate().update(state, state.tr), dispatch);
export class AddColumnBeforeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that a column is added
   * before the column with the current Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isInTable(editorState)) return false/*nothing to do*/;

    const rect = selectedRect(editorState);
    if(!rect) return false/*no selected Rectangle in Table*/;

    const updatedTr = addColumn(tr, rect, rect.left);
    return updatedTr;
  }
}

/** add a column after the column with the current Selection */
export const addColumnAfterCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new AddColumnAfterDocumentUpdate().update(state, state.tr), dispatch);
export class AddColumnAfterDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that a column is added
   * after the column with the current Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isInTable(editorState)) return false/*nothing to do*/;

    const rect = selectedRect(editorState);
    if(!rect) return false/*no selected Rectangle in Table*/;

    const updatedTr = addColumn(tr, rect, rect.right);
    return updatedTr;
  }
}


/** remove the selected columns from a Table */
export const deleteColumnCommand: Command = (state, dispatch) => {
  const x = AbstractDocumentUpdate.execute(new DeleteColumnDocumentUpdate().update(state, state.tr), dispatch);
  console.log(x);
  return x;
}
export class DeleteColumnDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that the selected Columns
   * are removed from a Table */
  public update(editorState: EditorState, tr: Transaction) {
    if(!isInTable(editorState)) return false/*nothing to do*/;

    const rect = selectedRect(editorState);
    if(!rect) return false/*no selected Rectangle in Table*/;

    const { table, tableMap, tableStart } = rect;
    if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return false/*cannot use Rect*/;
    if(rect.left === 0 && rect.right === tableMap.width) return false/*do nothing*/;

    for(let i = rect.right - 1; ; i--) {
      removeColumn(tr, rect, i);
      if(i === rect.left) break/*nothing left to do*/;

      rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
      if(!rect.table) return false/*Table does not exist*/;

      rect.tableMap = TableMap.get(rect.table);
    }

    return tr/*updated*/;
  }
}

/** add a Column at the given position in a Table Node */
const addColumn = (tr: Transaction, { table, tableMap, tableStart }: OptionalRectProps, col: number) => {
  if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return tr/*do nothing*/;

  let referenceColumn: number | null = col > 0 ? -1 : 0;
  if(columnIsHeader(tableMap, table, col + referenceColumn)) {
    referenceColumn = col === 0 || col === tableMap.width ? null : 0;
  } /* else -- computed column is not a Header */

  for(let row = 0; row < tableMap.height; row++) {
    const index = row * tableMap.width + col;

    // if the position falls inside a column spanning Cell
    if(col > 0 && col < tableMap.width && tableMap.map[index - 1] === tableMap.map[index]) {
      let pos = tableMap.map[index];
      const cell = table.nodeAt(pos);
      if(!cell) continue/*nothing to do*/;

      tr.setNodeMarkup(tr.mapping.map(tableStart + pos), null/*maintain type*/, addColSpan(cell.attrs, col - tableMap.colCount(pos)));
      // skip ahead if rowSpan > 1
      row += cell.attrs[AttributeType.RowSpan] - 1;

    } else {
      const type =
        referenceColumn === null
          ? getTableNodeTypes(table.type.schema)[NodeName.CELL]
          : table.nodeAt(tableMap.map[index + referenceColumn])?.type;

      const mappedPos = tableMap.positionAt(row, col, table);
      const nodeOfType = type?.createAndFill();

      if(nodeOfType) {
        tr.insert(tr.mapping.map(tableStart + mappedPos), nodeOfType);
      } /* else -- could not create Node, do not insert anything */
    }
  }

  return tr;
};

const removeColumn = (tr: Transaction, { table, tableMap, tableStart }: OptionalRectProps, col: number) => {
  if(!table || !tableMap || !tableStart) return/*do nothing*/;

  const mapStart = tr.mapping.maps.length;
  for(let row = 0; row < tableMap.height;) {
    const index = row * tableMap.width + col;
    const pos = tableMap.map[index];

    const cell = table.nodeAt(pos);
    if(!cell) continue/*nothing to do*/;

    // if this is part of a col-spanning cell
    if((col > 0 && tableMap.map[index - 1] == pos) || (col < tableMap.width - 1 && tableMap.map[index + 1] == pos)) {
      tr.setNodeMarkup(tr.mapping.slice(mapStart).map(tableStart + pos), null/*maintain type*/, removeColSpan(cell.attrs, col - tableMap.colCount(pos)));
    } else {
      const start = tr.mapping.slice(mapStart).map(tableStart + pos);
      tr.delete(start, start + cell.nodeSize);
    }
    row += cell.attrs[AttributeType.RowSpan];
  }
};

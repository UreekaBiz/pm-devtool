import { Command, EditorState, TextSelection, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, isCellNode, isCellSelection, isHeaderCellNode, isTableNode, AbstractDocumentUpdate, TABLE_DEFAULT_COLUMNS, TABLE_DEFAULT_ROWS, TABLE_DEFAULT_WITH_HEDER_ROW } from 'common';

import { deleteTable } from '../../command';
import { createTable } from './util';

// ********************************************************************************
// == Create ======================================================================
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
// == Delete ======================================================================
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

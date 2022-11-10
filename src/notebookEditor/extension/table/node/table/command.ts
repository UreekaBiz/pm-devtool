import { Command, TextSelection } from 'prosemirror-state';

import { findParentNodeClosestToPos, isCellNode, isCellSelection, isHeaderCellNode, isTableNode, TABLE_DEFAULT_COLUMNS, TABLE_DEFAULT_ROWS, TABLE_DEFAULT_WITH_HEDER_ROW } from 'common';

import { deleteTable } from '../../command';
import { createTable } from './util';

// ********************************************************************************
// == Create ======================================================================
export const insertTableCommand = ({ rows = TABLE_DEFAULT_ROWS, cols = TABLE_DEFAULT_COLUMNS, withHeaderRow = TABLE_DEFAULT_WITH_HEDER_ROW } = {/*default no attrs*/}): Command => (state, dispatch) => {
  if(!dispatch) return false;

  const { tr } = state ;
  const node = createTable(state.schema, rows, cols, withHeaderRow);
  const offset = tr.selection.anchor + 1/*inside the table*/;

  tr.replaceSelectionWith(node)
    .scrollIntoView()
    .setSelection(TextSelection.near(tr.doc.resolve(offset)));

  return true;
};

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

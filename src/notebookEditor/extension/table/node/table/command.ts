import { Command } from 'prosemirror-state';

import { findParentNodeClosestToPos, isCellNode, isCellSelection, isHeaderCellNode, isTableNode } from 'common';

import { deleteTable } from '../../command';

// ********************************************************************************
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

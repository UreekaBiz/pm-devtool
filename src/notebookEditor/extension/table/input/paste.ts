import { Slice, Fragment } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { clipCells, fitSlice, getTableNodeTypes, isCellSelection, insertCells, isSelectionHeadInTable, getResolvedCellPos, pastedCells, TableMap } from 'common';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js#L121
export const handleTablePaste = (view: EditorView, event: ClipboardEvent, slice: Slice) => {
  if(!isSelectionHeadInTable(view.state)) return false/*do not handle*/;

  let cells = pastedCells(slice);
  const { selection } = view.state;

  if(isCellSelection(selection)) {
    if(!cells) {
      cells = { width: 1/*default*/, height: 1/*default*/, rows: [Fragment.from(fitSlice(getTableNodeTypes(view.state.schema).cell, slice))] };
    } /* else -- Cells exist */

    const table = selection.$anchorCell.node(-1/*grandParent*/),
          tableMap = TableMap.get(table),
          tableStart = selection.$anchorCell.start(-1/*grandParent depth*/);

    const tableRect = tableMap.rectBetween(selection.$anchorCell.pos - tableStart, selection.$headCell.pos - tableStart);
    cells = clipCells(cells, tableRect.right - tableRect.left, tableRect.bottom - tableRect.top);
    insertCells(view.state, view.dispatch, tableStart, tableRect, cells);

    return true/*handled*/;
  } else if(cells) {
    const selectedCell = getResolvedCellPos(view.state);
    if(!selectedCell) return false/*do not handle*/;

    const tableMap = TableMap.get(selectedCell.node(-1/*grandParent*/)),
          tableStart = selectedCell.start(-1/*grandParent depth*/);
    insertCells(view.state, view.dispatch, tableStart, tableMap.findCell(selectedCell.pos - tableStart), cells);
    return true/*handled*/;
  } else {
    return false/*do not handle*/;
  }
};



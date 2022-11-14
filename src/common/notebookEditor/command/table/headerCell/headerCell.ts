import { NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { NodeName } from '../../../../notebookEditor/node/type';
import { TableRect } from '../../../extension/table/class';
import { getTableNodeTypes } from '../../../extension/table/node/table';
import { isInTable, selectedRect } from '../../..//extension/table/util';
import { DispatchType } from '../../type';

// ********************************************************************************
/** toggles between row/column Header and normal Cells (only applies to first row/column) */
export const toggleHeaderCommand = (type: 'column' | 'row' | 'cell') => (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const types = getTableNodeTypes(state.schema);

    const rect = selectedRect(state);
    if(!rect || !rect.tableMap) return false/*no selected Rectangle in Table*/;

    const { tr } = state;

    const isHeaderRowEnabled = isHeaderEnabledByType('row', rect, types);
    const isHeaderColumnEnabled = isHeaderEnabledByType('column', rect, types);

    let isHeaderEnabled = false/*default*/;
    if(type === 'column') { isHeaderEnabled = isHeaderRowEnabled; }
    else { isHeaderEnabled = isHeaderColumnEnabled; }

    const selectionStartsAt = isHeaderEnabled ? 1 : 0;

    let cellsRect = rect/*default*/;
    if(type === 'column') { cellsRect = new TableRect(0, selectionStartsAt, 1, rect.tableMap.height); }
    else if(type ==='row') { cellsRect = new TableRect(selectionStartsAt, 0, rect.tableMap.width, 1); }
    /* else -- do not change default */

    let newType = types[NodeName.CELL]/*default*/;
    if(type === 'column') {
      if(isHeaderColumnEnabled) { newType = types[NodeName.CELL]; }
      else { newType = types[NodeName.HEADER_CELL]; }

    } else if(type === 'row') {
      if(isHeaderRowEnabled) { newType = types[NodeName.CELL]; }
      else { newType = types[NodeName.HEADER_CELL]; }
    } /* else -- do not change default */

    rect.tableMap.cellsInRect(cellsRect).forEach((relativeCellPos) => {
      const cellPos = relativeCellPos + (rect.tableStart ?? 0/*no tableStart*/);
      const cell = tr.doc.nodeAt(cellPos);

      if(cell) {
        tr.setNodeMarkup(cellPos, newType, cell.attrs);
      } /* else -- no Cell exists at cellPos */
    });

    dispatch(tr);
  }

  return true;
};

/** toggles whether the selected Row contains HeaderCells */
export const toggleHeaderRowCommand = toggleHeaderCommand('row');

/** toggles whether the selected Column contains header Cells */
export const toggleHeaderColumnCommand = toggleHeaderCommand('column');

/** toggles whether the selected Cells are HeaderCells */
export const toggleHeaderCellCommand = toggleHeaderCommand('cell');

// == Util ========================================================================
const isHeaderEnabledByType = (type: 'column' | 'row', rect: TableRect, types: { [nodeName: string]: NodeType; }) => {
  if(!rect.table || !rect.tableMap) return false/*no tablemap available*/;

  // Get cell positions for first row or first column
  const cellPositions = rect.tableMap.cellsInRect({
    left: 0,
    top: 0,
    right: type === 'row' ? rect.tableMap.width : 1,
    bottom: type === 'column' ? rect.tableMap.height : 1,
    table: undefined,
    tableMap: undefined,
    tableStart: undefined,
  });

  for(let i = 0; i < cellPositions.length; i++) {
    const cell = rect.table.nodeAt(cellPositions[i]);

    if(cell && cell.type !== types[NodeName.HEADER_CELL]) {
      return false;
    } /* else -- cell does not exist or is not a Header Cell */
  }

  return true/*default*/;
};

import { NodeType } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';

import { NodeName } from '../../../../notebookEditor/node/type';
import { isNotNullOrUndefined } from '../../../../util';
import { TableMap, TableRect } from '../../../extension/table/class';
import { getTableNodeTypes } from '../../../extension/table/node/table';
import { isSelectionHeadInRow, getSelectedTableRect } from '../../..//extension/table/util';
import { AbstractDocumentUpdate } from '../../type';

// ********************************************************************************
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/commands.js

/** toggles between row/column Header and normal Cells (only applies to first row/column) */
export const toggleHeaderCommand = (type: 'row' | 'column' | 'cell'): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleHeaderDocumentUpdate(type).update(state, state.tr), dispatch);
export class ToggleHeaderDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly type: 'row' | 'column' | 'cell') {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableTypes = getTableNodeTypes(editorState.schema);
    const rect = getSelectedTableRect(editorState);
    if(!rect) return false/*no selected Rectangle in Table*/;

    const { tableMap } = rect;
    if(!isNotNullOrUndefined<TableMap>(tableMap)) return false/*nothing to do*/;

    const isHeaderRowEnabled = isHeaderEnabledByType('row', rect, tableTypes);
    const isHeaderColumnEnabled = isHeaderEnabledByType('column', rect, tableTypes);

    let isHeaderEnabled = false/*default*/;
    if(this.type === 'column') { isHeaderEnabled = isHeaderRowEnabled; }
    else { isHeaderEnabled = isHeaderColumnEnabled; }

    const selectionStartsAt = isHeaderEnabled ? 1 : 0;

    let cellsRect = rect/*default*/;
    if(this.type === 'column') { cellsRect = new TableRect(0, selectionStartsAt, 1, tableMap.height); }
    else if(this.type === 'row') { cellsRect = new TableRect(selectionStartsAt, 0, tableMap.width, 1); }
    /* else -- do not change default */

    let newType = tableTypes[NodeName.CELL]/*default*/;
    if(this.type === 'column') {
      if(isHeaderColumnEnabled) { newType = tableTypes[NodeName.CELL]; }
      else { newType = tableTypes[NodeName.HEADER_CELL]; }

    } else if(this.type === 'row') {
      if(isHeaderRowEnabled) { newType = tableTypes[NodeName.CELL]; }
      else { newType = tableTypes[NodeName.HEADER_CELL]; }
    } /* else -- do not change default */

    tableMap.getCellsInTableRect(cellsRect).forEach((relativeCellPos) => {
      const cellPos = relativeCellPos + (rect.tableStart ?? 0/*no tableStart*/);
      const cell = tr.doc.nodeAt(cellPos);

      if(cell) {
        tr.setNodeMarkup(cellPos, newType, cell.attrs);
      } /* else -- no Cell exists at cellPos */
    });

    return tr/*updated*/;
  }
}

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
  const cellPositions = rect.tableMap.getCellsInTableRect({
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

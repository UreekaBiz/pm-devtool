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
  AbstractDocumentUpdate.execute(new ToggleHeaderDocumentUpdate(type), state, dispatch);
export class ToggleHeaderDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly type: 'row' | 'column' | 'cell') {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    const tableNodeTypes = getTableNodeTypes(editorState.schema);
    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no selected Rectangle in Table*/;

    const { tableMap } = tableRect;
    if(!isNotNullOrUndefined<TableMap>(tableMap)) return false/*nothing to do*/;

    const isHeaderRowEnabled = isHeaderEnabledByType('row', tableRect, tableNodeTypes),
          isHeaderColumnEnabled = isHeaderEnabledByType('column', tableRect, tableNodeTypes);

    let isHeaderEnabled = false/*default*/;
    if(this.type === 'column') { isHeaderEnabled = isHeaderRowEnabled; }
    else { isHeaderEnabled = isHeaderColumnEnabled; }

    const selectionStartsAt = isHeaderEnabled ? 1 : 0;

    let cellsRect = tableRect/*default*/;
    if(this.type === 'column') { cellsRect = new TableRect(0/*left*/, selectionStartsAt/*top*/, 1/*right*/, tableMap.height/*bottom*/); }
    else if(this.type === 'row') { cellsRect = new TableRect(selectionStartsAt/*left*/, 0/*top*/, tableMap.width/*right*/, 1/*bottom*/); }
    /* else -- do not change default */

    let newCellType = tableNodeTypes[NodeName.CELL]/*default*/;
    if(this.type === 'column') {
      if(isHeaderColumnEnabled) { newCellType = tableNodeTypes[NodeName.CELL]; }
      else { newCellType = tableNodeTypes[NodeName.HEADER_CELL]; }

    } else if(this.type === 'row') {
      if(isHeaderRowEnabled) { newCellType = tableNodeTypes[NodeName.CELL]; }
      else { newCellType = tableNodeTypes[NodeName.HEADER_CELL]; }
    } /* else -- do not change default */

    tableMap.getCellsInTableRect(cellsRect).forEach((relativeCellPos) => {
      const cellPos = relativeCellPos + (tableRect.tableStart ?? 0/*no tableStart*/),
            cellNode = tr.doc.nodeAt(cellPos);

      if(cellNode) {
        tr.setNodeMarkup(cellPos, newCellType, cellNode.attrs);
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
/** check if a Header is enabled  */
const isHeaderEnabledByType = (type: 'column' | 'row', tableRect: TableRect, types: { [nodeName: string]: NodeType; }) => {
  if(!tableRect.table || !tableRect.tableMap) return false/*no tablemap available*/;

  // Get cell positions for first row or first column
  const cellPositions = tableRect.tableMap.getCellsInTableRect({
    // NOTE these are defaults
    left: 0,
    top: 0,
    right: type === 'row' ? tableRect.tableMap.width : 1,
    bottom: type === 'column' ? tableRect.tableMap.height : 1,
    table: undefined,
    tableMap: undefined,
    tableStart: undefined,
  });

  for(let i = 0; i < cellPositions.length; i++) {
    const cellNode = tableRect.table.nodeAt(cellPositions[i]);
    if(cellNode && cellNode.type !== types[NodeName.HEADER_CELL]) {
      return false;
    } /* else -- Cell does not exist or it is a Header Cell */
  }

  return true/*default*/;
};

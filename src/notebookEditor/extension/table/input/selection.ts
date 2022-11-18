import { Slice } from 'prosemirror-model';
import { EditorState, Selection, Transaction } from 'prosemirror-state';

import { getTableNodeTypes, isCellSelection, DispatchType, NodeName, AbstractDocumentUpdate } from 'common';

// ********************************************************************************
// == Delete ======================================================================
/** delete a CellSelection if it exists */
export const deleteCellSelectionCommand = (state: EditorState, dispatch: DispatchType) =>
  AbstractDocumentUpdate.execute(new DeleteCellSelectionDocumentUpdate().update(state, state.tr), dispatch);
class DeleteCellSelectionDocumentUpdate implements AbstractDocumentUpdate {
  constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that a CellSelection is deleted if it exists
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;
    if(!isCellSelection(selection)) return false/*nothing to do*/;

    const baseCell = getTableNodeTypes(editorState.schema)[NodeName.CELL].createAndFill();
    if(!baseCell) return false/*could not create baseCell*/;

    const baseContent = baseCell.content;
    selection.forEachCell((cell, pos) => {
      if(!cell) return/*nothing to do*/;

      if(!cell.content.eq(baseContent)) {
        tr.replace(tr.mapping.map(pos + 1), tr.mapping.map(pos + cell.nodeSize - 1), new Slice(baseContent, 0/*use full Slice*/, 0/*use full Slice*/));
      } /* else -- Cell already has the base content */
    });

    return tr/*updated*/;
  }
}

// == Util ========================================================================
export const setNewCellSelectionFromInput = (editorState: EditorState, selection: Selection, tr: Transaction) => {
  if(editorState.selection.eq(selection)) return false/*same Selection as the current one*/;

  tr.setSelection(selection).scrollIntoView();
  return tr/*updated*/;
};

import { EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, Command } from 'common';

// ********************************************************************************
/** Inserts a Tab. (SEE: ExtensionPriority) for details on handling */
export const insertTabCommand: Command = (state, dispatch) => {
  const updatedTr = new InsertTabDocumentUpdate().update(state, state.tr);
  dispatch(updatedTr);
  return true/*command executed*/;
};
export class InsertTabDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that a Tab is inserted and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    tr.insertText('\t');
    return tr;
  }
}

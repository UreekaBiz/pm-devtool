import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate } from 'common';

// ********************************************************************************
export const insertTabCommand: Command = (state, dispatch) => AbstractDocumentUpdate.execute(new InsertTabDocumentUpdate(), state, dispatch);
export class InsertTabDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that a Tab is inserted and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    tr.insertText('\t');
    return tr/*updated*/;
  }
}

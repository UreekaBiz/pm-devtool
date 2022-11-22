import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, MarkName } from 'common';

import { ToggleOrSetMarkDocumentUpdate } from '../markHolder/command';

// ********************************************************************************
/** toggle the Underline Mark */
export const toggleUnderlineCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleUnderlineDocumentUpdate(), state, dispatch);
export class ToggleUnderlineDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the Underline Mark
   * is toggled and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const updatedTr = new ToggleOrSetMarkDocumentUpdate(editorState.schema.marks[MarkName.UNDERLINE]).update(editorState, tr);
    return updatedTr/*updated*/;
  }
}

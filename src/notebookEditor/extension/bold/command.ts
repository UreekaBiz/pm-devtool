import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, MarkName } from 'common';

import { ToggleOrSetMarkDocumentUpdate } from '../markHolder/command';

// ********************************************************************************
/** toggle the Bold Mark */
export const toggleBoldCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleBoldDocumentUpdate(), state, dispatch);
export class ToggleBoldDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the Bold Mark
   * is toggled and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const updatedTr = new ToggleOrSetMarkDocumentUpdate(editorState.schema.marks[MarkName.BOLD]).update(editorState, tr);
    return updatedTr/*updated*/;
  }
}

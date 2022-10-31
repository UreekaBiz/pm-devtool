import { Command, EditorState, Transaction } from 'prosemirror-state';

import {  AbstractDocumentUpdate, MarkName } from 'common';

import { ToggleOrSetMarkDocumentUpdate } from '../markHolder/command';

// ********************************************************************************
/** toggle the Strikethrough Mark */
export const toggleStrikethroughCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleStrikethroughDocumentUpdate().update(state, state.tr), dispatch);
export class ToggleStrikethroughDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the Strikethrough Mark
   * is toggled and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const updatedTr = new ToggleOrSetMarkDocumentUpdate(editorState.schema.marks[MarkName.STRIKETHROUGH]).update(editorState, tr);
    return updatedTr/*updated*/;
  }
}

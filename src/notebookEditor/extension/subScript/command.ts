import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, MarkName } from 'common';

import { ToggleOrSetMarkDocumentUpdate } from '../markHolder/command';

// ********************************************************************************
/** toggle the SubScript Mark */
export const toggleSubScriptCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleSubScriptDocumentUpdate(), state, dispatch);
export class ToggleSubScriptDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the SubScript Mark
   * is toggled and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const updatedTr = new ToggleOrSetMarkDocumentUpdate(editorState.schema.marks[MarkName.SUB_SCRIPT]).update(editorState, tr);
    return updatedTr/*updated*/;
  }
}

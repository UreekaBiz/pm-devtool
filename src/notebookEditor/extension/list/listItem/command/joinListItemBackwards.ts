import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate } from 'common';

// ********************************************************************************
export const joinListItemBackwardsCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new JoinListItemBackwardsDocumentUpdate().update(state, state.tr), dispatch);
export class JoinListItemBackwardsDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {

    return tr/*updated*/;
  }
}

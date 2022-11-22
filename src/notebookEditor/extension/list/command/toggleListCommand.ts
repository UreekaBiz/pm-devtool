import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, NodeName } from 'common';

// ********************************************************************************
// toggle the type of a List
export const toggleListCommand = (listTypeName: NodeName.BULLET_LIST | NodeName.ORDERED_LIST): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemDocumentUpdate(listTypeName), state, dispatch);
export class LiftListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly listTypeName: NodeName.BULLET_LIST | NodeName.ORDERED_LIST) {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {
    // check if wrapping into a List

    // check if unwrapping from a List

    // check if changing the type of the List

    return tr/*updated*/;
  }
}

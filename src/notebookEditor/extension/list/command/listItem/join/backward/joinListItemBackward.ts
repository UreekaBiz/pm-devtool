import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate } from 'common';

// ********************************************************************************
// join the parent of the current Selection to the end of the closest ListItem above
export const joinListItemBackwardCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new JoinListItemBackwardDocumentUpdate(), state, dispatch);

export class JoinListItemBackwardDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that the parent of the current
   * Selection gets lifted to the closest ListItem above
   */
  public update(editorState: EditorState, tr: Transaction) {
    // -- Checks ------------------------------------------------------------------
    const { selection } = editorState,
          { empty, $from, from } = selection,
          { parent } = $from;
    if(!empty) return false/*do not allow if Selection is not empty*/;
    if(!parent.isTextblock) return false/*parent is not a TextBlock, nothing to do*/;
    if($from.before() + 1/*inside the TextBlock*/ !== from) return false/*Selection is not at the start of the parent TextBlock*/;

    // -- Join --------------------------------------------------------------------
    const newSelection = (Selection.near(tr.doc.resolve($from.before()), -1/*look backwards*/));
    if(!(parent.type === newSelection.$from.parent.type)) return false/*cannot be merged*/;

    return tr.delete(newSelection.$from.pos, from);
  }
}

import { Command, EditorState, NodeSelection, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, AsyncNodeType, HISTORY_META } from 'common';

// ********************************************************************************
// replace an entire inline CodeBlockAsyncNode with another one
export const replaceAsyncNodeCommand = (newAsyncNode: AsyncNodeType, replacementPosition: number): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ReplaceAsyncNodeDocumentUpdate(newAsyncNode, replacementPosition), state, dispatch);
export class ReplaceAsyncNodeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly newAsyncNode: AsyncNodeType, private readonly replacementPosition: number) {/*nothing additional*/}
  /**
   * modify the given Transaction such that an entire CodeBlockAsyncNode is
   * replaced with another one and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
      tr.setSelection(NodeSelection.create(tr.doc, this.replacementPosition))
        .replaceSelectionWith(this.newAsyncNode)
        .setSelection(NodeSelection.create(tr.doc, this.replacementPosition))
        .setMeta(HISTORY_META, false/*once executed, an async node cannot go back to non-executed*/);
    return tr/*updated*/;
  }
}

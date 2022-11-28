import { Command, EditorState, Transaction } from 'prosemirror-state';

import { isListNode, AbstractDocumentUpdate } from 'common';

// ********************************************************************************
/**
 * join the parent of the current Selection to the end of the
 * closest ListItem above
 */
export const joinBackwardToEndOfClosestListItemCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new JoinBackwardToEndOfClosestListItemDocumentUpdate(), state, dispatch);

export class JoinBackwardToEndOfClosestListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that the parent of the current
   * Selection gets lifted to the closest ListItem above
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { doc, selection } = editorState,
          { empty, $from, from } = selection,
          { parent } = $from;
    if(!empty) return false/*do not allow if Selection is not empty*/;
    if(!parent.isTextblock) return false/*parent is not a TextBlock, nothing to do*/;
    if($from.before() + 1/*inside the TextBlock*/ !== from) return false/*Selection is not at the start of the parent TextBlock*/;

    const parentIndex = $from.index(0/*direct Doc depth*/),
          previousChildIndex = parentIndex - 1/*by definition*/;
    if(parentIndex === 0/*first direct child of Doc*/) return false/*no previous child by definition*/;

    const previousList = doc.child(previousChildIndex);
    if(!isListNode(previousList)) return false/*no List to join into*/;

    let lastTextChildOfListPos = 0/*default*/;
    previousList.descendants((node, pos) => {
      if(!node.isText) return/*ignore*/;
      lastTextChildOfListPos = (pos + 1/*inside the Node*/) + node.nodeSize;
    });

    const $lastChildOfListPos = doc.resolve(lastTextChildOfListPos);
    if(!(parent.type === $lastChildOfListPos.parent.type)) return false/*cannot be merged*/;

    return tr.delete(lastTextChildOfListPos, from);
  }
}

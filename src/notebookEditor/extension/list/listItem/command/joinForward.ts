import { Command, EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { isBulletListNode, isListItemNode, isOrderedListNode, AbstractDocumentUpdate } from 'common';

// ********************************************************** **********************
export const joinForwardToStartOfClosestListItemCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new JoinForwardToStartOfClosestListItemDocumentUpdate(), state, dispatch);

export class JoinForwardToStartOfClosestListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction, view: EditorView | undefined/*not given*/) {
    const { doc, selection } = editorState,
          { empty, $from, from } = selection;
    if(!empty) return false/*do not allow if Selection is not empty*/;
    if(!$from.parent.isTextblock) return false/*parent is not a TextBlock, nothing to do*/;
    if($from.end() !== from) return false/*Selection is not at the end of the parent TextBlock*/;

    const grandParent = $from.node(-1/*grandParent depth*/),
          insideList = grandParent && isListItemNode(grandParent),
          nodeAfterEndPos = $from.end() + (insideList ? 2/*account for nested-ness*/ : 1/*no need to account*/),
          nodeAfterEnd = doc.nodeAt(nodeAfterEndPos);
    if(!nodeAfterEnd) return false/*do not handle*/;

    const nextNodeIsList = isBulletListNode(nodeAfterEnd) || isOrderedListNode(nodeAfterEnd),
          nextNodeIsListItem = isListItemNode(nodeAfterEnd);
    if(!nextNodeIsList && !nextNodeIsListItem) return false/*do not handle*/;

    if($from.parent.content.size < 1/*empty*/) {
      // if the current parent is empty, delete it up to the point where
      // the next List or ListItem starts
      const nextPosToRight = Selection.near(tr.doc.resolve(tr.selection.$from.end()+1), 1/*bias to the right*/);
      tr.setSelection(TextSelection.create(tr.doc, tr.selection.from, nextPosToRight.$from.pos))
        .deleteSelection();
      return tr/*updated*/;
    } else {
      // move the contents of the next ListItem to the end of the current one
      const listItem = nodeAfterEnd.firstChild;
      if(!listItem) return false/*no ListItem exists*/;
      tr.replaceWith(from, nodeAfterEndPos + listItem.nodeSize, listItem.content);

      // do the equivalent of a final join forward to ensure the content
      // of the first child of the nest ListItem is appended to the end
      // of the current one. This is only needed if there is a List below
      if(nextNodeIsList) {
        const nextPosToRight = Selection.near(tr.doc.resolve(tr.selection.$from.end()+1/*past end of the current Block*/), 1/*bias to the right*/);
        tr.delete(tr.selection.from, nextPosToRight.from);
      } /* else -- no need to delete */

      return tr/*updated*/;
    }
  }
}

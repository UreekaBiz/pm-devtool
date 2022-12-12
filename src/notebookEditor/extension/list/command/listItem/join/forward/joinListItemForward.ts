import { Command, EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { isListNode, isListItemNode, isHeadingNode, isNodeEmpty, isParagraphNode, AbstractDocumentUpdate, AncestorDepth } from 'common';

// ********************************************************** **********************
export const joinListItemForwardCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new JoinListItemForwardsDocumentUpdate(), state, dispatch);

export class JoinListItemForwardsDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction, view: EditorView | undefined/*not given*/) {
    // -- Checks ------------------------------------------------------------------
    const { doc, selection } = editorState,
          { empty, $from, from } = selection;
    if(!empty) return false/*do not allow if Selection is not empty*/;
    if(!$from.parent.isTextblock) return false/*parent is not a TextBlock, nothing to do*/;
    if($from.end() !== from) return false/*Selection is not at the end of the parent TextBlock*/;

    const grandParent = $from.node(AncestorDepth.GrandParent),
          insideList = grandParent && isListItemNode(grandParent),
          nodeAfterEndPos = $from.end() + (insideList ? 2/*account for nested-ness*/ : 1/*no need to account*/),
          nodeAfterEnd = doc.nodeAt(nodeAfterEndPos);
    if(!nodeAfterEnd) return false/*do not handle*/;

    const nextNodeIsList = isListNode(nodeAfterEnd),
          nextNodeIsListItem = isListItemNode(nodeAfterEnd);
    if(!nextNodeIsList && !nextNodeIsListItem) return false/*do not handle*/;

    // -- Join --------------------------------------------------------------------
    // TODO: this is effectively joining forward a given amount of times
    if(isNodeEmpty($from.parent)) {
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
      // of the current one. This is only needed if there is a List where
      // the firstChild of its first ListItem is a Paragraph or Heading
      if(nextNodeIsList && listItem.firstChild && (isHeadingNode(listItem.firstChild) || isParagraphNode(listItem.firstChild))) {
        const nextPosToRight = Selection.near(tr.doc.resolve(tr.selection.$from.end()+1/*past end of the current Block*/), 1/*bias to the right*/);
        tr.delete(tr.selection.from, nextPosToRight.from);
      } /* else -- no need to delete */

      return tr/*updated*/;
    }
  }
}

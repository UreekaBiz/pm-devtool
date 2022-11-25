import { Command, EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, isListNode, AbstractDocumentUpdate, isListItemNode } from 'common';

import { checkAndMergeListAtPos, fromOrToInListItem, getListItemPositions } from './util';
import { NodeRange } from 'prosemirror-model';

// ********************************************************************************
// == Sink ========================================================================
// sink a ListItem
export const sinkListItemCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SinkListItemDocumentUpdate(), state, dispatch);
export class SinkListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem augments its depth */
  public update(editorState: EditorState, tr: Transaction) {
    if(!fromOrToInListItem(editorState.selection)) return false/*Selection not inside a ListItem*/;

    const { empty, $from, from, to } = editorState.selection;
    if(empty && from !== $from.before()+1/*immediately at the start of the parent Block*/) return false/*do not allow*/;

    const listItemPositions = getListItemPositions(editorState, { from, to });
    for(let i=0; i<listItemPositions.length; i++) {
      const originalPosition = listItemPositions[i],
            mappedPosition = tr.mapping.map(originalPosition);
      const listItemPos = mappedPosition,
            $listItemPos = tr.doc.resolve(listItemPos),
            listItem = tr.doc.nodeAt(listItemPos);
      if(!listItem || !isListItemNode(listItem)) continue/*not a ListItem at the expected position */;

      const listItemEndPos = listItemPos + listItem.nodeSize,
            $listItemEndPos = tr.doc.resolve(listItemEndPos);
      const sinkBlockRange = new NodeRange($listItemPos, $listItemEndPos, $listItemPos.depth/*depth*/);

      const closestListObj = findParentNodeClosestToPos($listItemPos, isListNode);
      if(!closestListObj) continue/*no list to take type from*/;

      tr.wrap(sinkBlockRange, [{ type: closestListObj.node.type, attrs: closestListObj.node.attrs }]);
      checkAndMergeListAtPos(tr, listItemPos);
    }

    return tr/*updated*/;
  }
}

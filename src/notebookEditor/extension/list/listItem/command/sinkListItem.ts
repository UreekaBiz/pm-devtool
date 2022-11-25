import { Command, EditorState, Transaction } from 'prosemirror-state';

import { isListItemNode, isListNode, AbstractDocumentUpdate } from 'common';

import { checkAndMergeListAtPos, fromOrToInListItem, getListItemPositions } from './util';

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

    const { from, to } = editorState.selection,
          listItemPositions = getListItemPositions(editorState, { from, to });

    for(let i=0; i<listItemPositions.length; i++) {
      const listItemPos = listItemPositions[i],
            $listItemPos = tr.doc.resolve(listItemPos),
            listItem = tr.doc.nodeAt(listItemPos-1/*the ListItem itself*/),
            list = $listItemPos.node(-1/*ancestor*/);
      if(!listItem || !isListItemNode(listItem) || !isListNode(list)) continue/*invalid conditions to sink, do not modify Transaction*/;

      const sinkBlockRange = $listItemPos.blockRange();
      if(!sinkBlockRange) continue/*no range to sink*/;

      tr.wrap(sinkBlockRange, [{ type: list.type }]);
      checkAndMergeListAtPos(tr, listItemPos);
    }

    return tr/*updated*/;
  }
}

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

    const { $from, from, to } = editorState.selection;
    if(from !== $from.before()+1/*immediately at the start of the parent Block*/) return false/*do not allow*/;

    const listItemPositions = getListItemPositions(editorState, { from, to });
    listItemPositions.reverse(/*start from deepest depth*/).forEach((listItemPos) => {
      const listItem = tr.doc.nodeAt(listItemPos-1/*the ListItem itself*/),
            $listItemPos = tr.doc.resolve(listItemPos),
            list = $listItemPos.node(-1/*ancestor*/);
      if(!listItem || !isListItemNode(listItem) || !isListNode(list)) return/*cannot sink ListItem, do not modify Transaction*/;

      const listItemBlockRange = $listItemPos.blockRange();
      if(!listItemBlockRange) return/*no suitable wrap range exists*/;

      tr.wrap(listItemBlockRange, [{ type: list.type }]);
      checkAndMergeListAtPos(tr, listItemPos);
    });

    return tr/*updated*/;
  }
}

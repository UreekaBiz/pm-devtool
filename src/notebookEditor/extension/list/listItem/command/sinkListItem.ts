import { Command, EditorState, Transaction } from 'prosemirror-state';

import { getListItemNodeType, AbstractDocumentUpdate, NodeName } from 'common';

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

    let parentListType = editorState.schema.nodes[NodeName.BULLET_LIST]/*default*/;

    const listItemPositions = getListItemPositions(editorState, { from, to });
    listItemPositions.reverse(/*start from deepest depth*/).forEach((listItemPos) => {
      const $listItemPos = tr.doc.resolve(listItemPos);
      if($listItemPos.depth > 1/*nested*/) {
        parentListType = $listItemPos.node(-1/*grandParent*/).type;
      } /* else -- not nested */
      if(!parentListType) return/*reached the Doc Node*/;

      const listItemBlockRange = $listItemPos.blockRange();
      if(!listItemBlockRange) return/*no suitable wrap range exists*/;

      tr.wrap(listItemBlockRange, [{ type: parentListType }]);
      checkAndMergeListAtPos(getListItemNodeType(editorState.schema), tr, listItemPos);
    });

    return tr/*updated*/;
  }
}

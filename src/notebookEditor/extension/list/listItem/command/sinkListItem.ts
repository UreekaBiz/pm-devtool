import { Command, EditorState, Transaction } from 'prosemirror-state';
import { NodeRange } from 'prosemirror-model';

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
    for(let i=0; i<listItemPositions.length; i++) {
      const listItemPos = listItemPositions[i],
            $listItemPos = tr.doc.resolve(listItemPos),
            listItem = tr.doc.nodeAt(listItemPos-1/*the ListItem itself*/),
            list = $listItemPos.node(-1/*ancestor*/);
      if(!listItem || !isListItemNode(listItem) || !isListNode(list)) continue/*cannot sink ListItem, do not modify Transaction*/;

      const { $from } = tr.selection;
      let sinkBlockRange: NodeRange | null = null/*default*/;

      let sinkListItemChild = false/*default*/;
      if($from.parent === listItem.firstChild) {
        sinkBlockRange = $listItemPos.blockRange();
      } else {
        /**
         * make the range go from the start of $from's parent to the end of the ListItem
         * to ensure this behavior (| is the cursor):
         * 1. hello                    1. hello
         *    |world  ==============>     1. world
         *    foo                            foo
         * 2. bar                      2. bar
         */
        sinkBlockRange = new NodeRange(tr.doc.resolve($from.before()), tr.doc.resolve($from.end()), $listItemPos.depth);
        sinkListItemChild = true/*by definition*/;
      }
      if(!sinkBlockRange) continue/*no suitable wrap range exists*/;

      const wrapTypes = [ { type: list.type }, ...(sinkListItemChild ? [{ type: listItem.type }] : [/*do not add listItem wrapper*/])];
      tr.wrap(sinkBlockRange, wrapTypes);

      if(!sinkListItemChild) {
        checkAndMergeListAtPos(tr, listItemPos);
      } /* else -- a child was nested further, do not check and merge lists */
    }

    return tr/*updated*/;
  }
}

import { NodeRange } from 'prosemirror-model';
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

    const { $from: $stateFrom, from: stateFrom, to: stateTo } = editorState.selection;
    if(stateFrom !== $stateFrom.before()+1/*immediately at the start of the parent Block*/) return false/*do not allow*/;

    const listItemPositions = getListItemPositions(editorState, { from: stateFrom, to: stateTo });
    for(let i=0; i<listItemPositions.length; i++) {
      const listItemPos = listItemPositions[i],
            $listItemPos = tr.doc.resolve(listItemPos),
            listItem = tr.doc.nodeAt(listItemPos-1/*the ListItem itself*/),
            list = $listItemPos.node(-1/*ancestor*/);
      if(!listItem || !isListItemNode(listItem) || !isListNode(list)) continue/*invalid conditions to sink, do not modify Transaction*/;

      const { $from: $trFrom } = tr.selection;
      let sinkBlockRange: NodeRange | null = null/*default*/;

      let sinkListItemChild = false/*default*/;
      if($trFrom.parent === listItem.firstChild) {
        sinkBlockRange = $listItemPos.blockRange();
        sinkBlockRange && tr.wrap(sinkBlockRange, [{ type: list.type }]);
      } else {
        /**
         * make the range go from the start of $from's parent to the end of the ListItem
         * to ensure this behavior (| is the cursor):
         * 1. hello                    1. hello
         *    |world  ==============>     1. world
         *    foo                         foo
         * 2. bar                      2. bar
         */
        sinkBlockRange = new NodeRange(tr.doc.resolve($trFrom.before()), tr.doc.resolve($trFrom.end()), $listItemPos.depth);
        sinkListItemChild = true/*by definition*/;

        // replace the range with a new list that has as many nested lists as needed
        tr.lift(sinkBlockRange, 0/*lift to the top*/);
        let newRange: NodeRange | null = null/*default*/;
        for(let i=0; i<$listItemPos.depth/*sink*/; i++) {
          newRange = tr.selection.$from.blockRange();
          if(!newRange) break/*invalid range, do not modify Transaction*/;
          tr.wrap(newRange, [{ type: list.type }]);
        }
        newRange = tr.selection.$from.blockRange();
        tr.wrap(newRange!, [{ type: listItem.type }]);

      }
      if(!sinkBlockRange) continue/*invalid range, do not modify Transaction*/;

      if(!sinkListItemChild) {
        checkAndMergeListAtPos(tr, listItemPos);
      } /* else -- a child was nested further, do not check and merge lists */
    }

    return tr/*updated*/;
  }
}

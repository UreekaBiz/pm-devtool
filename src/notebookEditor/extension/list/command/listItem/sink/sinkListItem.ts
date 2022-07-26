import { NodeRange } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, isListNode, isListItemNode, isGapCursorSelection, AbstractDocumentUpdate, ListItemNodeType } from 'common';

import { checkAndMergeListAtPos, fromOrToInListItem, getListItemPositions } from '../util';

// ********************************************************************************
// == Sink ========================================================================
// sink a ListItem
export const sinkListItemCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SinkListItemDocumentUpdate(), state, dispatch);
export class SinkListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /** modify the given Transaction such that a ListItem augments its depth */
  public update(editorState: EditorState, tr: Transaction) {
    // -- Checks ------------------------------------------------------------------
    const { doc, selection } = editorState,
          { empty, $from, from, $to, to } = selection;

    if(isGapCursorSelection(selection)) return false/*do not allow*/;
    if(!fromOrToInListItem(editorState.selection)) return false/*Selection not inside a ListItem*/;
    if(empty && from !== $from.before() + 1/*immediately at the start of the parent Block*/) return false/*do not allow*/;

    // -- Sink --------------------------------------------------------------------
    const blockRange = $from.blockRange($to);
    if(!blockRange) return false/*no range in which to lift ListItems*/;
    const { depth: blockRangeDepth } = blockRange;

    const listItemPositions = getListItemPositions(doc, { from, to }, blockRangeDepth-1/*depth of blockRange wrapper*/);
          listItemPositions.forEach(listItemPosition => sinkListItem(tr, listItemPosition));

    if(tr.docChanged) return tr/*updated*/;
    else return false/*no changes were made to the doc*/;
  }
}

// ================================================================================
// perform the required modifications to a Transaction such that
// the ListItem at the given position increases its depth
const sinkListItem = (tr: Transaction, listItemPos: number) => {
  const mappedListItemPos = tr.mapping.map(listItemPos),
        $listItemPos = tr.doc.resolve(mappedListItemPos),
        listItem = tr.doc.nodeAt(mappedListItemPos);
  if(!listItem || !isListItemNode(listItem)) return/*not a ListItem at the expected position */;

  const listItemEndPos = mappedListItemPos + listItem.nodeSize,
        $listItemEndPos = tr.doc.resolve(listItemEndPos);
  const sinkBlockRange = new NodeRange($listItemPos, $listItemEndPos, $listItemPos.depth/*depth*/);

  const closestListObj = findParentNodeClosestToPos($listItemPos, isListNode);
  if(!closestListObj) return/*no list to take type from*/;

  tr.wrap(sinkBlockRange, [{ type: closestListObj.node.type, attrs: closestListObj.node.attrs }]);

  checkForListMergeAroundPos(tr, listItem, mappedListItemPos);
  return tr/*modified*/;
};

// NOTE: this specifically ensures that
//            1. hello                 1. hello
//  1. world             turns into    2. world
//            1. foo                   3. foo
// after a sink operation
/**
 * check if a List can be merged before, at or after
 * the given listItemPosition
 */
const checkForListMergeAroundPos = (tr: Transaction, listItem: ListItemNodeType, listItemPos: number) => {
  checkAndMergeListAtPos(tr, listItemPos-1/*before the ListItem*/);
  checkAndMergeListAtPos(tr, listItemPos/*at the ListItem*/);
  checkAndMergeListAtPos(tr, listItemPos+ listItem.nodeSize+1/*at the next ListItem if it exists*/);
};

import { NodeRange } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, isListNode, isListItemNode, isGapCursorSelection, AbstractDocumentUpdate } from 'common';

import { checkAndMergeListAtPos, fromOrToInListItem, getListItemPositions } from './util';

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

    /**
     * NOTE: only take into account ListItems whose depth is greater than or equal to
     *       blockRangeDepth - 1, so that for example:
     *       ul(li(blockquote(li(p('hello'))))) will not sink the first ListItem, and
     *       just sinks the inner most one
     */
    const listItemPositions = getListItemPositions(doc, { from, to }, blockRangeDepth-1/*(SEE: NOTE above)*/);
    for(let i = 0; i < listItemPositions.length; i++) {
      const updatedTr = sinkListItem(tr, listItemPositions[i]);
      if(updatedTr) { tr = updatedTr; }
      else { return false/*could not sink at least one of the listItems*/; }
    }

    if(tr.docChanged) { return tr/*updated*/; }
    else { return false/*no changes were made to the doc*/; }
  }
}

// perform the required modifications to a Transaction such that
// the ListItem at the given position increases its depth
const sinkListItem = (tr: Transaction, listItemPos: number) => {
  const mappedListItemPos = tr.mapping.map(listItemPos),
        $listItemPos = tr.doc.resolve(mappedListItemPos),
        listItem = tr.doc.nodeAt(mappedListItemPos);
  if(!listItem || !isListItemNode(listItem)) return false/*not a ListItem at the expected position */;

  const listItemEndPos = mappedListItemPos + listItem.nodeSize,
        $listItemEndPos = tr.doc.resolve(listItemEndPos);
  const sinkBlockRange = new NodeRange($listItemPos, $listItemEndPos, $listItemPos.depth/*depth*/);

  const closestListObj = findParentNodeClosestToPos($listItemPos, isListNode);
  if(!closestListObj) return false/*no list to take type from*/;

  tr.wrap(sinkBlockRange, [{ type: closestListObj.node.type, attrs: closestListObj.node.attrs }]);
  checkAndMergeListAtPos(tr, mappedListItemPos);

  return tr/*modified*/;
};

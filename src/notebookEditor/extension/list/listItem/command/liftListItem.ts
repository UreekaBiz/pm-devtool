import { NodeRange } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { isListItemNode, isListNode, isNotNullOrUndefined, AbstractDocumentUpdate } from 'common';

import { getListItemPositions } from './util';

// ********************************************************************************
// == Lift ========================================================================
// lift a ListItem
export const liftListItemCommand = (triggerKey: 'Enter' | 'Shift-Tab' | 'Backspace'): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemDocumentUpdate(triggerKey), state, dispatch);
export class LiftListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly triggerKey: 'Enter' | 'Shift-Tab' | 'Backspace') {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {
    // -- Checks ------------------------------------------------------------------
    const { doc, selection } = editorState,
          { empty, $from, from, $to, to } = selection;

    if(this.triggerKey === 'Backspace' || this.triggerKey === 'Enter') {
      if(!empty) return false/*do not allow if Selection not empty when Back*/;
      if(($from.before()+1/*immediately inside the TextBlock*/ !== from)) return false/*Selection is not at the start of the parent TextBlock*/;

      if(this.triggerKey === 'Enter') {
        if($from.parent.textContent.length > 0/*not empty*/) return false/*only allow lift on Enter if parent is empty*/;
      } /* else -- do not check enter-specific case */
    } /* else -- backspace / enter checks done */

    // -- Lift --------------------------------------------------------------------
    const blockRange = $from.blockRange($to);
    if(!blockRange) return false/*no range in which to lift ListItems*/;
    const { depth: blockRangeDepth } = blockRange;

    /**
     * NOTE: only take into account ListItems whose depth is greater than or equal to
     *       blockRangeDepth - 1, so that for example:
     *       bl(li(blockquote(li(p('hello'))))) will not lift the first ListItem, and
     *       just lifts the inner most one
     */
    let listItemPositions = getListItemPositions(doc, { from, to }, blockRangeDepth-1/*(SEE: NOTE above)*/);

    for(let i=0; i<listItemPositions.length; i++) {
      const updatedTr = liftListItem(tr, listItemPositions[i]);
      if(updatedTr) {
        tr = updatedTr;
      } /* else -- do not lift that ListItem */
    }

    if(tr.docChanged) { return tr/*updated*/; }
    else { return false/*no changes were made to the doc*/; }
  }
}

// perform the required modifications to a Transaction such that
// the ListItem at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const mappedListItemPos = tr.mapping.map(listItemPos),
        listItem = tr.doc.nodeAt(mappedListItemPos),
        $listItemPos = tr.doc.resolve(mappedListItemPos);
  if(!listItem || !isListItemNode(listItem)) return false/*cannot lift item, do not modify Transaction*/;

  const listItemEndPos = mappedListItemPos + listItem.nodeSize,
        $listItemEndPos = tr.doc.resolve(listItemEndPos);
  let liftBlockRange: NodeRange | null = new NodeRange($listItemPos, $listItemEndPos, $listItemPos.depth);

  const $insideListItemPos = tr.doc.resolve($listItemEndPos.pos-2/*inside the ListItem, inside its lastChild*/),
        listContainer = $insideListItemPos.node(-3/*Node holding the List*/);
  let liftListItemContents = false/*default*/;
  if(listContainer && (listContainer.isBlock && !listContainer.isTextblock) && !isListNode(listContainer)) {
    liftListItemContents = true;
  } /* else -- listContainer does not exist, it is not a Node like Doc or Blockquote, or it is a List */

  if(liftListItemContents) {
    liftBlockRange = $insideListItemPos.blockRange();
    const targetDepth = liftBlockRange && liftTarget(liftBlockRange);
    isNotNullOrUndefined<number>(targetDepth) && tr.lift(liftBlockRange!/*guaranteed by targetDepth being defined*/, targetDepth);
  } else {
    const targetDepth = liftTarget(liftBlockRange);
    tr.lift(liftBlockRange, targetDepth ? targetDepth : liftBlockRange.depth - 1/*decrease depth*/);
  }

  return tr;
};

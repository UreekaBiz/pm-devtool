import { NodeRange } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { isDocumentNode, isListItemNode, AbstractDocumentUpdate } from 'common';

import { fromOrToInListItem, getListItemPositions } from './util';

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
    if(!fromOrToInListItem(editorState.selection)) return false/*Selection not inside a ListItem*/;
    const { doc, selection } = editorState,
          { empty, $from, from, to } = selection;

    if(this.triggerKey === 'Backspace' || this.triggerKey === 'Enter') {
      if(!empty) return false/*do not allow if Selection not empty when Back*/;
      if(($from.before()+1/*immediately inside the TextBlock*/ !== from)) return false/*Selection is not at the start of the parent TextBlock*/;

      if(this.triggerKey === 'Enter') {
        if($from.parent.textContent.length > 0/*not empty*/) return false/*only allow lift on Enter if parent is empty*/;
      } /* else -- do not check enter-specific case */
    } /* else -- backspace / enter checks done */

    // -- Lift --------------------------------------------------------------------
    let listItemPositions = getListItemPositions(doc, { from, to });
    for(let i=0; i<listItemPositions.length; i++) {
      const updatedTr = liftListItem(tr, listItemPositions[i]);
      if(updatedTr) { tr = updatedTr; }
      else { return false/*could not lift at least one of the listItems*/; }
    }

    // check if any ListItems are direct children of the Doc and if they are
    // lift their contents again
    const newListItemPositions = getListItemPositions(doc, { from, to });
    for(let i=0; i<newListItemPositions.length; i++) {
      const insidePos = newListItemPositions[i]+2/*inside the ListItem, inside its firstChild*/,
            mappedInsidePos = tr.mapping.map(insidePos),
            $mappedInsidePos = tr.doc.resolve(mappedInsidePos);
      const greatGrandParent = $mappedInsidePos.node(-2/*greatGrandParent depth*/);
      if(!greatGrandParent || !isDocumentNode(greatGrandParent)) continue/*Doc is not greatGrandParent*/;

      const blockRange = $mappedInsidePos.blockRange();
      if(!blockRange) continue/*no range to lift again*/;

      tr.lift(blockRange, 0/*lift to be direct children of the Doc*/);
    }

    return tr/*updated*/;
  }
}

// perform the required modifications to a Transaction such that
// the ListItem at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const mappedListItemPos = tr.mapping.map(listItemPos),
        listItem = tr.doc.nodeAt(mappedListItemPos),
        $listItemPos = tr.doc.resolve(mappedListItemPos),
        list = $listItemPos.node(-1/*ancestor*/);
  if(!listItem || !isListItemNode(listItem) || !list) return false/*cannot lift item, do not modify Transaction*/;

  const listItemEndPos = mappedListItemPos + listItem.nodeSize,
        $listItemEndPos = tr.doc.resolve(listItemEndPos);
  const liftBlockRange = new NodeRange($listItemPos, $listItemEndPos, $listItemPos.depth/*depth*/);

  const targetDepth = liftTarget(liftBlockRange);
  tr.lift(liftBlockRange, targetDepth ? targetDepth : liftBlockRange.depth - 1/*decrease depth*/);

  return tr;
};

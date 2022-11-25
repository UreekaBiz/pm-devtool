import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { isListItemNode, AbstractDocumentUpdate, NodeGroup } from 'common';

import { fromOrToInListItem, getInsideListItemPositions } from './util';

// ********************************************************************************
// == Lift ========================================================================
// lift a ListItem
export const liftListItemCommand = (from: 'Enter' | 'Shift-Tab' | 'Backspace'): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemDocumentUpdate(from), state, dispatch);
export class LiftListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly from: 'Enter' | 'Shift-Tab' | 'Backspace') {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {
    if(!fromOrToInListItem(editorState.selection)) return false/*Selection not inside a ListItem*/;

    const { empty, $from, from, to } = editorState.selection;

    if(this.from === 'Backspace' || this.from === 'Enter') {
      if(!empty) return false/*do not allow if Selection not empty when Back*/;
      if(($from.before()+1/*immediately inside the TextBlock*/ !== from)) return false/*Selection is not at the start of the parent TextBlock*/;

      if(this.from === 'Enter') {
        if($from.parent.textContent.length > 0/*not empty*/) return false/*only allow lift on Enter if parent is empty*/;
      } /* else -- do not check enter-specific case */

    } /* else -- backspace / enter checks done */

    const insideListItemPositions = getInsideListItemPositions(editorState, { from, to }).reverse(/*from deepest to most shallow*/);
    for(let i=0; i<insideListItemPositions.length; i++) {
      const updatedTr = liftListItem(tr, insideListItemPositions[i]);
      if(updatedTr) { tr = updatedTr; }
      else { return false/*could not lift*/; }
    }

    return tr/*updated*/;
  }
}

// perform the required modifications to a Transaction such that
// the Item at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const listItem = tr.doc.nodeAt(listItemPos-1/*the ListItem itself*/),
        $listItemPos = tr.doc.resolve(listItemPos),
        list = $listItemPos.node(-1/*ancestor*/);
  if(!listItem || !isListItemNode(listItem) || !list) return false/*cannot lift item, do not modify Transaction*/;

  const liftedBlockRange = $listItemPos.blockRange(/*lift the whole ListItem*/);
  if(!liftedBlockRange) return false/*no range to lift*/;

  const targetDepth = liftTarget(liftedBlockRange);
  tr.lift(liftedBlockRange, targetDepth ? targetDepth : liftedBlockRange.depth - 1/*decrease depth*/);

  // if the ListItem has depth 0 or its parent after lifting is not a List, delete the ListItem Range,
  // leaving only the content outside
  const $liftedBlockRangeStart = tr.doc.resolve(tr.mapping.map(liftedBlockRange.start));
  if(!$liftedBlockRangeStart.depth || !$liftedBlockRangeStart.parent.type.spec.group?.includes(NodeGroup.LIST)) {
    const listItem = $liftedBlockRangeStart.nodeAfter;
    if(!listItem) return false/*ListItem does not exist anymore*/;
    if(!tr.doc.type.contentMatch.defaultType) return false/*cannot insert a default NodeType at this position*/;

    const listItemLiftedContent: ProseMirrorNode[] = [/*initially empty*/];
    for(let i=0; i<listItem.childCount; i++) {
      listItemLiftedContent.push(listItem.child(i));
    }

    tr.replaceWith($liftedBlockRangeStart.pos, $liftedBlockRangeStart.pos + listItem.nodeSize, listItemLiftedContent);
  } /* else -- depth is defined or parent of range start is of type List */

  return tr;
};

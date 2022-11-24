import { Node as ProseMirrorNode, NodeRange } from 'prosemirror-model';
import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';
import { findWrapping, liftTarget } from 'prosemirror-transform';

import { isDocumentNode, isListItemNode, AbstractDocumentUpdate, NodeGroup } from 'common';

import { fromOrToInListItem, getListItemPositions } from './util';

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

    const { empty, $from, from, to } = editorState.selection,
          originalFrom = from;

    if(this.from === 'Backspace') {
      if(!empty) return false/*do not allow if Selection not empty when Back*/;
      if(($from.before()+1/*immediately inside the TextBlock*/ !== from)) return false/*Selection is not at the start of the parent TextBlock*/;
    } /* else -- backspace checks done */

    const listItemPositions = getListItemPositions(editorState, { from, to }).reverse(/*from deepest to most shallow*/);
    for(let i=0; i<listItemPositions.length; i++) {
      const updatedTr = liftListItem(tr, listItemPositions[i]);
      if(updatedTr) { tr = updatedTr; }
      else { return false/*could not lift*/; }
    }

    const liftedToDoc = isDocumentNode(tr.selection.$from.node(-1/*grandParent*/));
    return liftedToDoc
      ? tr.setSelection(Selection.near(tr.doc.resolve(originalFrom - 2/*account for removed List and ListItem*/)))
      : tr/*no Selection changes*/;
  }
}

// perform the required modifications to a Transaction such that
// the Item at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const listItem = tr.doc.nodeAt(listItemPos-1/*the ListItem itself*/),
        $listItemPos = tr.doc.resolve(listItemPos),
        list = $listItemPos.node(-1/*ancestor*/);
  if(!listItem || !isListItemNode(listItem) || !list) return false/*cannot lift item, do not modify Transaction*/;

  const { $from } = tr.selection;
  let liftedBlockRange: NodeRange | null = null/*default*/;

  let liftedListItemChild = false/*default*/;
  if($from.parent === listItem.firstChild) {
    liftedBlockRange = $listItemPos.blockRange(/*lift the whole ListItem*/);
  } else {
    liftedBlockRange = $from.blockRange(/*lift the current child of the ListItem*/);
    liftedListItemChild = true/*by definition*/;
  }
  if(!liftedBlockRange) return false/*no valid range to lift*/;

  let targetDepth = liftTarget(liftedBlockRange);
  if(liftedListItemChild) {
    const wrappers = findWrapping(liftedBlockRange, list.type);
    if(!wrappers) return false/*could not find valid wrapping when it was needed*/;

    tr.wrap(liftedBlockRange, wrappers);

    // update the lifted Range's end by creating a new one that includes the wrapping
    const $from = tr.doc.resolve(liftedBlockRange.$from.pos),
          $to = tr.doc.resolve(liftedBlockRange.$to.pos);
    liftedBlockRange = new NodeRange($from, $to, liftedBlockRange.depth);
  } /* else -- no need to wrap */

  if(targetDepth) {
    tr.lift(liftedBlockRange, targetDepth);
  } else {
    let liftDepth = liftedBlockRange.depth - (liftedListItemChild ? 2/*account for the wrapping*/ : 1 /*default just decrease depth by 1*/);
    tr.lift(liftedBlockRange, liftDepth);
  }

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

    tr.replaceWith($liftedBlockRangeStart.pos, $liftedBlockRangeStart.pos + listItem.nodeSize, listItemLiftedContent)
      .setSelection(Selection.near(tr.doc.resolve($liftedBlockRangeStart.pos)));
  } /* else -- depth is defined or parent of range start is of type List */

  return tr;
};

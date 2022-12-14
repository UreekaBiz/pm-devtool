import { NodeRange } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { isListItemNode, isListNode, isGapCursorSelection, isNodeEmpty, isNotNullOrUndefined, AbstractDocumentUpdate, AncestorDepth, isNonTextBlockBlock } from 'common';

// ********************************************************************************
export enum LiftListOperation {
  // the Untoggle operation is associated with Enter, whenever a ListItem is empty,
  // there is no Selection, and the cursor is at the start of the TextBlock inside
  // the ListItem
  Untoggle = 'Untoggle',

  // the Dedent operation is associated with Shift-Tab, regardless of whether or
  // not the ListItem TextBlock is empty, since the User just wants to decrease
  // the indentation of the selected ListItems
  Dedent = 'dedent',

  // the Remove operation is associated with Backspace, since the User wants to
  // decrease the indentation of the selected ListItem. It has the
  // same restrictions as the Untoggle operation
  Remove = 'remove',
}

// == Lift ========================================================================
// lift a ListItem
export const liftListItemCommand = (operation: LiftListOperation): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemDocumentUpdate(operation), state, dispatch);
export class LiftListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly operation: LiftListOperation) {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {
    // -- Checks ------------------------------------------------------------------
    const { doc, selection } = editorState;
    if(isGapCursorSelection(selection)) return false/*do not allow*/;

    const { empty, $from, from, $to, to } = selection;
    if(this.operation === LiftListOperation.Untoggle || this.operation === LiftListOperation.Remove) {
      if(!empty) return false/*do not allow if Selection not empty*/;
      if(($from.before()+1/*immediately inside the TextBlock*/ !== from)) return false/*Selection is not at the start of the parent TextBlock*/;

      if(this.operation === LiftListOperation.Untoggle) {
        if(!isNodeEmpty($from.parent)) return false/*only allow lift on Enter if parent is empty*/;
      } /* else -- do not check enter-specific case */
    } /* else -- backspace / enter checks done */

    // -- Lift --------------------------------------------------------------------
    const blockRange = $from.blockRange($to);
    if(!blockRange) return false/*no range in which to lift ListItems*/;
    const { depth: blockRangeDepth } = blockRange;

    const listItemPositions = getListItemPositions(doc, { from, to }, blockRangeDepth-1/*depth of blockRange wrapper*/);
          listItemPositions.forEach(listItemPosition => liftListItem(tr, listItemPosition));

    if(tr.docChanged) return tr/*updated*/;
    else return false/*no changes were made to the doc*/;
  }
}

// ================================================================================
// perform the required modifications to a Transaction such that
// the ListItem at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const mappedListItemPos = tr.mapping.map(listItemPos),
        listItem = tr.doc.nodeAt(mappedListItemPos),
        $listItemPos = tr.doc.resolve(mappedListItemPos);
  if(!listItem || !isListItemNode(listItem)) return/*cannot lift item, do not modify Transaction*/;

  const listItemEndPos = mappedListItemPos + listItem.nodeSize,
        $listItemEndPos = tr.doc.resolve(listItemEndPos);
  let liftBlockRange: NodeRange | null = new NodeRange($listItemPos, $listItemEndPos, $listItemPos.depth);

  const $insideListItemPos = tr.doc.resolve($listItemEndPos.pos-2/*inside the ListItem, inside its lastChild*/),
        listContainer = $insideListItemPos.node(AncestorDepth.GreatGreatGrandParent);
  let liftListItemContents = false/*default*/;
  if(listContainer && (isNonTextBlockBlock(listContainer)) && !isListNode(listContainer)) {
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
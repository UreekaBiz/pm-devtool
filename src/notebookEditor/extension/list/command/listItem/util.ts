import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection, Transaction } from 'prosemirror-state';
import { canJoin } from 'prosemirror-transform';

import { isListItemNode, AncestorDepth, SelectionRange, isNotNullOrUndefined } from 'common';

// ********************************************************************************
// NOTE: only take into account ListItems whose depth is greater than or equal to
//       the given maxDepth, so that for example:
//       ul(li(blockquote(li(p('hello'))))) will not return the first ListItem,
//       only inner most one
/**
 * get the position inside each ListItem present in the given Range.
 * only the ListItems that have a depth greater than or equal to maxDepth
 * will be returned (SEE: NOTE above)
 */
export const getListItemPositions = (doc: ProseMirrorNode, selectionRange: SelectionRange, maxDepth: number) => {
  const { from, to } = selectionRange;
  const listItemPositions: number[] = [/*default empty*/];

  doc.nodesBetween(from, to, (node, pos) => {
    if(!isListItemNode(node)) return/*ignore Node*/;

    const $listItemPos = doc.resolve(pos);
    if(!($listItemPos.depth >= maxDepth)) return/*depth is not greater than or equal to maxDepth*/;

    listItemPositions.push(pos);
  });

  return listItemPositions;
};

/** check the given Selection to see if its from or its to are inside a ListItem */
export const fromOrToInListItem = (selection: Selection) => {
  const { $from, $to } = selection,
        fromGrandParent = $from.node(AncestorDepth.GrandParent),
        toGrandParent = $to.node(AncestorDepth.GrandParent);
  if(!fromGrandParent || !toGrandParent) return false/*Selection not inside a ListItem*/;

  if(!isListItemNode(fromGrandParent) || !isListItemNode(toGrandParent)) return false/*no part of the given Selection is inside a ListItem*/;

  return true/*either from or to are inside a ListItem*/;
};

/**
 * check if the given Transaction is in a state such that two Lists
 * can be merged together at the given position (i.e. turn two
 * separate Lists into a single one)
 */
 export const checkAndMergeListAtPos = (tr: Transaction, posToCheck: number) => {
  if(!fromOrToInListItem(tr.selection)) return false/*Selection not inside a ListItem*/;

  const startingDoc = tr.doc.copy(tr.doc.content);
  const $pos = tr.doc.resolve(posToCheck);
  let posBefore = posToCheck/*default*/,
      posAfter = posToCheck/*default*/;
  if($pos.depth) {
    posBefore = $pos.before();
    posAfter = $pos.after();
  } /* else -- pos it at top level */


  const newPosAfter = checkForJoinAtPosBefore(tr, posBefore);
  if(isNotNullOrUndefined<number>(newPosAfter)) {
    posAfter = newPosAfter;
  } /* else -- do not modify posAfter */
  checkForJoinAtPosAfter(tr, posAfter);

  if(startingDoc.eq(tr.doc)) return false/*the Doc did not change*/;
  else return true/*the Doc changed*/;
};

// == Util ========================================================================
/** check if a join can occur at the given posBefore */
const checkForJoinAtPosBefore = (tr: Transaction, posBefore: number) => {
  const $posBefore = tr.doc.resolve(posBefore),
      { nodeBefore, nodeAfter } = $posBefore;

  let posBeforeNodeBefore = 0/*default*/;
  if(nodeBefore) {
    posBeforeNodeBefore = posBefore - nodeBefore.nodeSize;
  } /* else -- there is no Node before the pos at posBefore */
  if(!nodesAreOfSameTypeAndCanBeJoinedAtPos(tr, nodeBefore, nodeAfter, posBefore)) return/*cannot join*/;

  tr.join(posBefore);

  const nodeAtPosBeforeNodeBefore = tr.doc.nodeAt(posBeforeNodeBefore);
  if(nodeAtPosBeforeNodeBefore) {
    const newPosAfter = posBeforeNodeBefore + nodeAtPosBeforeNodeBefore.nodeSize;
    return newPosAfter;
  } /* else -- there is no Node before beforeNodePos */

  return undefined;
};

/** check if a join can occur at the given posAfter */
const checkForJoinAtPosAfter = (tr: Transaction, posAfter: number) => {
  const $posAfter = tr.doc.resolve(posAfter),
        { nodeBefore, nodeAfter } = $posAfter;
  if(!nodesAreOfSameTypeAndCanBeJoinedAtPos(tr, nodeBefore, nodeAfter, posAfter)) return/*cannot join*/;

  tr.join(posAfter);
};

/**
 * check if the two given ProseMirrorNodes exist, have the same type,
 * and a join can occur at the given position
 */
const nodesAreOfSameTypeAndCanBeJoinedAtPos = (tr: Transaction, nodeBefore: ProseMirrorNode | null, nodeAfter: ProseMirrorNode | null, joinPosition: number) =>
  nodeBefore && nodeAfter && nodeBefore.type === nodeAfter.type && canJoin(tr.doc, joinPosition);

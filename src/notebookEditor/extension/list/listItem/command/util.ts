import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection, Transaction } from 'prosemirror-state';
import { canJoin } from 'prosemirror-transform';

import { isListItemNode, SelectionRange } from 'common';

// ********************************************************************************
/** get the position inside each ListItem present in the given Range */
export const getListItemPositions = (doc: ProseMirrorNode, range: SelectionRange) => {
  const { from, to } = range;
  const listItemPositions: number[] = [/*default empty*/];

  doc.nodesBetween(from, to, (node, pos) => {
    if(isListItemNode(node)) {
      listItemPositions.push(pos);
    } /* else -- not an item of the specified type, ignore */

    return !node.isLeaf/*keep descending if node is not a Leaf*/;
  });

  return listItemPositions;
};

/** check the given Selection to see if its from or its to are inside a ListItem */
export const fromOrToInListItem = (selection: Selection) => {
  const { $from, $to } = selection,
        fromGrandParent = $from.node(-1/*grandParent ListItem*/),
        toGrandParent = $to.node(-1/*grandParent ListItem*/);
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
  let checkedAndMergedList = false/*default*/;
  if(!fromOrToInListItem(tr.selection)) return checkedAndMergedList/*Selection not inside a ListItem*/;

  const $pos = tr.doc.resolve(posToCheck);
  let posBefore = posToCheck/*default*/,
      posAfter = posToCheck/*default*/;
  if($pos.depth) {
    posBefore = $pos.before();
    posAfter = $pos.after();
  } /* else -- pos it at top level */

  const $resolvedPosBefore = tr.doc.resolve(posBefore),
        nodeBeforeResolvedPosBefore = $resolvedPosBefore.nodeBefore,
        nodeAfterResolvedPosBefore = $resolvedPosBefore.nodeAfter;

  let beforeNodePos = 0/*default*/;
  if(nodeBeforeResolvedPosBefore) {
    beforeNodePos = posBefore - nodeBeforeResolvedPosBefore.nodeSize;
  } /* else -- there is no Node before the pos at posBefore */

  if(nodeBeforeResolvedPosBefore
    && nodeAfterResolvedPosBefore
    && nodeBeforeResolvedPosBefore.type === nodeAfterResolvedPosBefore.type
    && canJoin(tr.doc, posBefore)
  ) {
    tr.join(posBefore);
    const nodeBefore = tr.doc.nodeAt(beforeNodePos);
    if(nodeBefore) {
      posAfter = beforeNodePos + nodeBefore.nodeSize;
    } /* else -- there is no Node before beforeNodePos */
    checkedAndMergedList = true;
  } /* else -- no nodeBeforeResolvedPosBefore, no nodeAfterResolvedPosBefore, different types or cannot join */

  const $resolvedPosAfter = tr.doc.resolve(posAfter),
        nodeBeforeResolvedPosAfter = $resolvedPosAfter.nodeBefore,
        nodeAfterResolvedPosAfter = $resolvedPosAfter.nodeAfter;

  if(nodeBeforeResolvedPosAfter
    && nodeAfterResolvedPosAfter
    && nodeBeforeResolvedPosAfter.type === nodeAfterResolvedPosAfter.type
    && canJoin(tr.doc, posAfter)
  ) {
    tr.join(posAfter);
    checkedAndMergedList = true;
  } /* else -- no nodeBeforeResolvedPosAfter, no nodeAfterResolvedPosAfter, different types or cannot join */

  return checkedAndMergedList;
};
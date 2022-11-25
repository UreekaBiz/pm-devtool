import { NodeRange } from 'prosemirror-model';
import { EditorState, Selection, Transaction } from 'prosemirror-state';
import { canJoin, findWrapping, liftTarget } from 'prosemirror-transform';

import { combineTransactionSteps, getTransformChangedRanges, isListItemNode, isListNode, SelectionRange } from 'common';

// == Util ========================================================================
/** get the positions of the start of the ListItems in the given Range */
export const getListItemPositions = (editorState: EditorState, range: SelectionRange) => {
  const { from, to } = range;
  const listItemPositions: number[] = [/*default empty*/];

  editorState.doc.nodesBetween(from, to, (node, pos) => {
    if(isListItemNode(node)) {
      listItemPositions.push(pos+1/*inside the ListItem*/);
    } /* else -- not an item of the specified type, ignore */

    return !node.isLeaf/*keep descending if node is not a Leaf*/;
  });

  return listItemPositions;
};

/** check the given Selection to see if its from or its to are inside a ListItem */
export const fromOrToInListItem = (selection: Selection) => {
  const { $from, $to } = selection,
        fromGrandParent = $from.node(-1/*grandParent listItem*/),
        toGrandParent = $to.node(-1/*grandParent listItem*/);
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

/**
 * prevent any ListItems that were changed by a set of Transactions
 * from being loose (i.e. not inside a List)
 */
 export const checkAndLiftChangedLists = (transactions: readonly Transaction[], oldState: EditorState, tr: Transaction) => {
  let wereListsLifted = false/*default*/;
  const transform = combineTransactionSteps(oldState.doc, [...transactions]),
        changes = getTransformChangedRanges(transform);
  const singleRange = changes.reduce<{ from: number; to: number; }>((singleRange, nextChange) => {
    const { newRange } = nextChange;
    return { from: Math.min(singleRange.from, newRange.from), to: Math.max(singleRange.to, newRange.to) };
  }, { from: tr.doc.nodeSize/*doc end*/, to: 0/*doc start*/ });

  tr.doc.nodesBetween(singleRange.from, singleRange.to, (affectedNode, nodePos) => {
    if(!isListNode(affectedNode)) return/*ignore*/;
    else {
      const affectedList = affectedNode;
      affectedList.descendants((childNode, childPos) => {
        const $childPos = tr.doc.resolve(childPos + 1/*inside the Node*/),
              listItem = $childPos.node(-1/*grandParent depth*/);
        // if the content at the nodePosition is 'loose' (i.e. not wrapped in)
        // a List, wrap it, and lift it to the nearest List
        if(listItem
          && isListItemNode(listItem)
          && !(affectedList === listItem.firstChild)
          ) {
          const blockRange = $childPos.blockRange(),
                wrappers = blockRange && findWrapping(blockRange, listItem.type);
          if(!wrappers) return/*no wrapping possible, do nothing*/;

          tr.wrap(blockRange, wrappers);
          const updatedRange = new NodeRange(tr.doc.resolve(blockRange.$from.pos), tr.doc.resolve(blockRange.$to.pos), blockRange.depth),
                liftTargetDepth = liftTarget(updatedRange);
          liftTargetDepth && tr.lift(updatedRange, liftTargetDepth);
          wereListsLifted = true/*lifted*/;
        }
      });
    }
  });

  return wereListsLifted;
};

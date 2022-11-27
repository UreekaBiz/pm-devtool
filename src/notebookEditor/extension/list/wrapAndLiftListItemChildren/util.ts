import { NodeRange } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';
import { findWrapping, liftTarget } from 'prosemirror-transform';

import { isListItemNode, isNotNullOrUndefined } from 'common';

import { getListItemPositions } from '../listItem/command';

// ********************************************************************************
/**
 * prevent any children inside ListItems that were
 * changed by a Transaction from being loose (i.e. not inside a List) by wrapping
 * them accordingly and lifting them to a suitable depth
 */
 export const wrapAndLiftListItemChildren = (tr: Transaction) => {
  let wereChildrenWrappedAndLifted = false/*default*/;

  const { doc } = tr,
        { from, to } = tr.selection;
  const listItemPositions = getListItemPositions(doc, { from, to });
  for(let i=0; i<listItemPositions.length; i++) {
    const listItemMappedPosition = tr.mapping.map(listItemPositions[i]),
          listItem = tr.doc.nodeAt(listItemMappedPosition);
    if(!listItem || !isListItemNode(listItem)) continue/*not a ListItem*/;

    // ensure there are no ListItems with children that are not wrapped in Lists
    if(listItem.childCount === 1/*only one child*/) continue/*no need to check*/;
    listItem.descendants((descendant, descendantPos, parent, childIndex) => {
      if(!parent || parent !== listItem || !descendant.isBlock || descendant === parent.firstChild) return/*ignore Node*/;
      if(descendant.type === listItem.child(childIndex-1/*prev child*/).type) return/*will be merged together*/;

      const childPos = tr.mapping.map(listItemMappedPosition+1/*inside the ListItem*/) + tr.mapping.map(descendantPos)+1/*inside the descendant*/,
            $childPos = tr.doc.resolve(childPos);

      const blockRange = $childPos.blockRange(),
            wrapping = blockRange && findWrapping(blockRange, listItem.type);
      if(!wrapping) return/*no wrapping possible, do nothing*/;

      tr.wrap(blockRange, wrapping);
      const updatedRange = new NodeRange(tr.doc.resolve(blockRange.$from.pos), tr.doc.resolve(blockRange.$to.pos), blockRange.depth),
            liftTargetDepth = liftTarget(updatedRange);

      if(isNotNullOrUndefined<number>(liftTargetDepth)) {
          tr.lift(updatedRange, liftTargetDepth);
      } /* else -- do not lift */

      wereChildrenWrappedAndLifted = true/*lifted*/;
    });
  }

  return wereChildrenWrappedAndLifted;
};

import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';

import { AncestorDepth, isListItemNode, isListNode, SelectionRange } from 'common';

// == Util ========================================================================
/**
 * get the position inside each ListItem present in the given Range.
 * only the ListItems that have a depth greater than or equal to maxDepth
 * will be returned (SEE: NOTE above)
 */
export const getListItemChildrenPositions = (doc: ProseMirrorNode, selectionRange: SelectionRange) => {
  const { from, to } = selectionRange;
  const listItemChildrenPositions: number[] = [/*default empty*/];

  doc.nodesBetween(from, to, (node, pos, parent) => {
    if(!parent || !isListItemNode(parent)) return/*ignore Node*/;
    if(isListNode(node)) return/*ignore Node*/;

    listItemChildrenPositions.push(pos);
  });

  return listItemChildrenPositions;
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

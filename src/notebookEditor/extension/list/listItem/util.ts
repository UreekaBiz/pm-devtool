import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';

import { AncestorDepth, isListItemNode, SelectionRange } from 'common';

// == Util ========================================================================
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

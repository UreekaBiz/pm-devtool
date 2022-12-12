import { Node as ProseMirrorNode } from 'prosemirror-model';

import { isListNode } from 'common';

// ********************************************************************************
// NOTE: only take into account ListItems whose depth is greater than or equal to
//       blockRangeDepth - 1 (before the current BlockRange), so that for example:
//       ul(li(blockquote(p('hello')))) will not return the top level UL
//       and will instead wrap the paragraph
export const isListBeforeCurrentBlockRange = (blockRangeDepth: number, node: ProseMirrorNode, nodeDepth: number) =>
  isListNode(node) && nodeDepth >= blockRangeDepth-1/*(SEE: NOTE above)*/;

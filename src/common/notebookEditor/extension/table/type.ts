import { Node as ProseMirrorNode } from 'prosemirror-model';

import { isCellNode, isHeaderCellNode, isRowNode, isTableNode } from './node';

// ********************************************************************************
// == UI ==========================================================================
export const TABLE_NODENAME = 'TABLE';
export const TD_NODENAME = 'TD';
export const TH_NODENAME = 'TH';

/** return whether the given Node is related to Table functionality */
export const isTableTypeNode = (node: ProseMirrorNode) =>
  isTableNode(node)
  || isRowNode(node)
  || isHeaderCellNode(node)
  || isCellNode(node);

// == Problem =====================================================================
export enum TableProblem {
  Collision = 'collision',
  ColWidthMistMatch = 'colWidthMistMatch',
  Missing = 'missing',
  OverlongRowSpan = 'overlongRowSpan',
}

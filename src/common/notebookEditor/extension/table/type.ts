// ********************************************************************************
// == UI ==========================================================================
export const TABLE_NODENAME = 'TABLE';
export const TD_NODENAME = 'TD';
export const TH_NODENAME = 'TH';

// == Role ========================================================================
export enum TableRole {
  Cell = 'cell',
  HeaderCell = 'headerCell',
  Row = 'row',
  Table = 'table',
}

// == Problem =====================================================================
export enum TableProblem {
  Collision = 'collision',
  ColWidthMistMatch = 'colWidthMistMatch',
  Missing = 'missing',
  OverlongRowSpan = 'overlongRowSpan',
}

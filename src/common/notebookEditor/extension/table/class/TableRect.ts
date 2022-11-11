import { Node as ProseMirrorNode } from 'prosemirror-model';

import { TableMap } from './TableMap';

// ********************************************************************************
// == Class =======================================================================
export class TableRect {
  // -- Attribute -----------------------------------------------------------------
  left: number;
  top: number;
  right: number;
  bottom: number;

  table: ProseMirrorNode | null | undefined;
  tableMap: TableMap | null | undefined;
  tableStart: number | null | undefined;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(left: number, top: number, right: number, bottom: number) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }
}

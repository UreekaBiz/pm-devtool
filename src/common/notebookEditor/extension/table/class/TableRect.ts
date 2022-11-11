import { Node as ProseMirrorNode } from 'prosemirror-model';

import { TableMap } from './TableMap';

// ********************************************************************************
// == Class =======================================================================
/**
 * a TableRect represents a rectangular CellSelection of a Table, which is taken
 * to have coordinates 0,0 at its upper-left corner. The top and left
 * values represent how far the current upper-left corner
 * of the CellSelection is from the start of the table, whereas the right and
 * bottom properties represent how far the current lower-right corner
 * is from the start of the Table
 *
 * this means that, for example, left always holds the amount of Cells between
 * the Cell at the upper-left corner of the CellSelection and the
 * left-boundary of the Table
 *
 * top always holds the amount of Cells between the currently selected Cell at
 * the upper-left corner of the CellSelection and the top-boundary of the Table
 *
 * right always holds the amount of Cells between the currently selected Cell
 * at the bottom-right corner of the CellSelection the left-boundary of the Table
 * (regardless of whether or not said Cells are in the CellSelection)
 *
 * bottom always holds the amount of Cells between the currently selected Cell
 * at the bottom-right corner of the CellSelection and the top-boundary
 * of the Table (regardless of whether or not said Cells are in the CellSelection)
 *
 * building a 10x10 Table and console.logging the TableRect of a CellSelection
 * is advised to better understand this
 */
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

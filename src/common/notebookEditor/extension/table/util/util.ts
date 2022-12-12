import { Attrs, Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Attributes, AttributeType } from '../../../attribute';
import { isCellSelection, isNodeSelection, AncestorDepth } from '../../../selection';
import { TableMap, TableRect } from '../class';
import { isCellNode } from '../node/cell';
import { getHeaderCellNodeType, isHeaderCellNode } from '../node/headerCell';
import { isRowNode } from '../node/row';

// ********************************************************************************
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/util.js

// == Row =========================================================================
/** check if the head of the {@link EditorState} Selection is in a Row */
export const isSelectionHeadInRow = (state: EditorState) => {
  const { $head } = state.selection;
  for(let depth = $head.depth; depth > 0/*not the top level (Document)*/; depth--) {
    if(isRowNode($head.node(depth))) {
      return true;
    } /* else -- Node at depth is not a Row */
  }

  return false /*default*/;
};

/** check if the two given {@link ResolvedPos} objs are in the same Table Node */
export const areResolvedPositionsInTable = ($pos1: ResolvedPos, $pos2: ResolvedPos) =>
  $pos1.depth == $pos2.depth && $pos1.pos >= $pos2.start(AncestorDepth.GrandParent) && $pos1.pos <= $pos2.end(AncestorDepth.GrandParent);

// == Column ======================================================================
  /** get the amount of columns that lie before the Cell at the given {@link ResolvedPos} */
export const getColumnAmountBeforeResolvedPos = ($pos: ResolvedPos) => {
  const tableMap = TableMap.getTableMap($pos.node(AncestorDepth.GrandParent));
  return tableMap.getColumnAmountBeforePos($pos.pos - $pos.start(AncestorDepth.GrandParent));
};

/**
 * add 'amount' columnSpans with value 0 to the given attributes, inserting them
 * at insertionPosition in the attribute's colWidth array
 */
export const addColumnSpans = (attrs: Partial<Attributes>, insertionPosition: number, amount = 1) => {
  const updatedAttrs = updateTableNodeAttributes(attrs, AttributeType.ColSpan, attrs[AttributeType.ColSpan] + amount);

  if(updatedAttrs[AttributeType.ColWidth]) {
    updatedAttrs[AttributeType.ColWidth] = updatedAttrs[AttributeType.ColWidth].slice();
    for(let i = 0; i < amount; i++) {
      updatedAttrs[AttributeType.ColWidth].splice(insertionPosition, 0/*do not remove anything*/, 0/*add a 0*/);
    }
  }

  return updatedAttrs;
};

export const removeColumnSpans = (attrs: Partial<Attributes>, removalPosition: number, amount = 1) => {
  const updatedAttrs = updateTableNodeAttributes(attrs, AttributeType.ColSpan, attrs[AttributeType.ColSpan] - amount);

  if(updatedAttrs[AttributeType.ColWidth]) {
    updatedAttrs[AttributeType.ColWidth] = updatedAttrs[AttributeType.ColWidth].slice(/*make a copy*/);
    updatedAttrs[AttributeType.ColWidth].splice(removalPosition, amount);

    if(!updatedAttrs[AttributeType.ColWidth].some((columnWidth: number) => columnWidth > 0)) {
      updatedAttrs[AttributeType.ColWidth] = null/*default state, no column widths*/;
    } /* else -- at least one of the colWidth array items is bigger than 0 */
  } /* else -- colWidth attribute is undefined */

  return updatedAttrs;
};

/** check if the column at the given columnPos is a header column */
export const isColumnHeader = (table: ProseMirrorNode, tableMap: TableMap, columnPos: number) => {
  const headerCellType = getHeaderCellNodeType(table.type.schema);

  for(let row = 0; row < tableMap.height; row++) {
    if(table.nodeAt(tableMap.map[columnPos + row * tableMap.width])?.type !== headerCellType) {
      return false/*not a headerCell*/;
    } /* else -- Node is a headerCell */
  }

  return true/*default*/;
};

// == Cell ========================================================================
/**
 * get a {@link ResolvedPos} pointing at the start of the cell around
 * the given {@link ResolvedPos}
 */
export const getResolvedCellPosAroundResolvedPos = ($pos: ResolvedPos) => {
  for(let depth = $pos.depth - 1/*start 1 above*/; depth > AncestorDepth.Document; depth--) {
    if(isRowNode($pos.node(depth))) {
      return $pos.node(AncestorDepth.Document).resolve($pos.before(depth + 1/*Cell depth*/));
    } /* else -- Node is not a Row node */
  }

  return null/*default*/;
};

/**
 * get the Node whose type should be used to wrap Cells at the
 * given {@link ResolvedPos}
 */
export const getCellWrapperAtResolvedPos = ($pos: ResolvedPos) => {
  for(let depth = $pos.depth; depth > 0; depth--) {
    // it is possible for Cell to be at the same depth
    const node = $pos.node(depth);

    if(isCellNode(node) || isHeaderCellNode(node)) {
      return $pos.node(depth);
    } /* else -- keep looking upwards through depth */
  }

  return null/*default*/;
};

export const getResolvedCellPos = (state: EditorState) => {
  const { selection } = state;

  if(isCellSelection(selection)) {
    const { $anchorCell, $headCell } = selection;
    return $anchorCell.pos > $headCell.pos
      ? $anchorCell
      : $headCell;

  } else if(isNodeSelection(selection) && isCellNode(selection.node)) {
    return selection.$anchor;
  } /* else -- look for $cellPos */

  return getResolvedCellPosAroundResolvedPos(selection.$head) || getResolvedCellPosNearResolvedPos(selection.$head);
};
const getResolvedCellPosNearResolvedPos = ($pos: ResolvedPos) => {
  // look at positions immediately after
  for(let nodeAfter = $pos.nodeAfter, pos = $pos.pos; nodeAfter; nodeAfter = nodeAfter.firstChild, pos++) {

    if(isCellNode(nodeAfter) || isHeaderCellNode(nodeAfter)) {
      return $pos.doc.resolve(pos);
    } /* else -- Node is neither a Cell nor a HeaderCell */
  }

  // look at positions that are before the given one
  for(let nodeBefore = $pos.nodeBefore, pos = $pos.pos; nodeBefore; nodeBefore = nodeBefore.lastChild, pos--) {
    if(isCellNode(nodeBefore) || isHeaderCellNode(nodeBefore)) {
      return $pos.doc.resolve(pos - nodeBefore.nodeSize);
    } /* else -- Node is neither a Cell nor a HeaderCell */
  }

  return/*default undefined*/;
};

/** return whether the given {@link ResolvedPos} points at a Cell */
export const isResolvedPosPointingAtCell = ($pos: ResolvedPos) => isRowNode($pos.parent) && $pos.nodeAfter/*there is a Cell*/;

/** return a {@link ResolvedPos} that points past its nodeAfter */
export const moveResolvedCellPosForward = ($pos: ResolvedPos) => $pos.nodeAfter && $pos.node(AncestorDepth.Document).resolve($pos.pos + $pos.nodeAfter.nodeSize);

/**
 * get the {@link TableRect} of the Cell at the given {@link ResolvedPos}
 */
export const getCellTableRect = ($pos: ResolvedPos) => {
  const tableMap = TableMap.getTableMap($pos.node(AncestorDepth.GrandParent));
  return tableMap.getCellTableRect($pos.pos - $pos.start(AncestorDepth.GrandParent));
};

/**
 * get the absolute position of the Cell at the given {@link ResolvedPos}
 * after moving it
 */
export const getMovedCellResolvedPos = ($pos: ResolvedPos, axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/bottom*/) => {
  const tableMap = TableMap.getTableMap($pos.node(AncestorDepth.GrandParent)),
        tableStart = $pos.start(AncestorDepth.GrandParent);

  const movedPosition = tableMap.getNextCellPos($pos.pos - tableStart, axis, direction);
  return movedPosition === null ? null : $pos.node(AncestorDepth.Document).resolve(tableStart + movedPosition);
};

// == TableRect ===================================================================
/**
 * get the selected TableRect in a Table if any, adding the TableMap,
 * TableNode, and TableStartOffset to the object
 */
 export const getSelectedTableRect = (state: EditorState) => {
  const { selection } = state;
  const cellPos = getResolvedCellPos(state);
  if(!cellPos) return null/*selection not in a Cell*/;

  const table = cellPos.node(AncestorDepth.GrandParent),
        tableStart = cellPos.start(AncestorDepth.GrandParent),
        tableMap = TableMap.getTableMap(table);

  let tableRect: TableRect;
  if(isCellSelection(selection)) { tableRect = tableMap.getTableRectBetweenCellPositions(selection.$anchorCell.pos - tableStart, selection.$headCell.pos - tableStart); }
  else { tableRect = tableMap.getCellTableRect(cellPos.pos - tableStart); }

  tableRect.tableStart = tableStart;
  tableRect.tableMap = tableMap;
  tableRect.table = table;
  return tableRect;
};

// == Attribute ===================================================================
export const updateTableNodeAttributes = (attrs: Attrs, updatedAttributeName: string, newValue: any) => {
  const updatedAttrs: Record<string, any> = {/*default empty*/};

  for(let prop in attrs) {
    updatedAttrs[prop] = attrs[prop];
  }

  updatedAttrs[updatedAttributeName] = newValue;
  return updatedAttrs;
};

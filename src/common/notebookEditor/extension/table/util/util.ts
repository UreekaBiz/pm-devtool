import { Attrs, Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Attributes, AttributeType } from '../../../attribute';
import { isCellSelection, isNodeSelection } from '../../../selection';
import { TableMap, TableRect } from '../class';
import { getHeaderCellNodeType } from '../node/headerCell';
import { TableRole } from '../type';

// ********************************************************************************
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/util.js

// == Row =========================================================================
/** check if the head of the {@link EditorState} Selection is in a Row */
export const isSelectionHeadInRow = (state: EditorState) => {
  const { $head } = state.selection;
  for(let depth = $head.depth; depth > 0/*not the top level (Document)*/; depth--) {
    if($head.node(depth).type.spec.tableRole === TableRole.Row) {
      return true;
    } /* else -- Node at depth is not a Row */
  }

  return false /*default*/;
};

/** check if the two given {@link ResolvedPos} objs are in the same Table Node */
export const areResolvedPositionsInTable = ($a: ResolvedPos, $b: ResolvedPos) => {
  return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1);
};

// == Column ======================================================================
  /** get the amount of columns that lie before the Cell at the given {@link ResolvedPos} */
export const getColumnAmountBeforeResolvedPos = ($pos: ResolvedPos) => {
  const tableMap = TableMap.getTableMap($pos.node(-1));
  return tableMap.getColumnAmountBeforePos($pos.pos - $pos.start(-1));
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
  for(let depth = $pos.depth - 1/*start 1 above*/; depth > 0/*while not reaching the Doc depth*/; depth--) {
    if($pos.node(depth).type.spec.tableRole === TableRole.Row) {
      return $pos.node(0/*the document*/).resolve($pos.before(depth + 1/*Cell depth*/));
    } /* else -- Node has no tableRole */
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
    const role = $pos.node(depth).type.spec.tableRole;

    if(role === TableRole.HeaderCell || role === TableRole.Cell) {
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

  } else if(isNodeSelection(selection) && selection.node && selection.node.type.spec.tableRole === TableRole.Cell) {
    return selection.$anchor;
  } /* else -- look for $cellPos */

  return getResolvedCellPosAroundResolvedPos(selection.$head) || getResolvedCellPosNearResolvedPos(selection.$head);
};
const getResolvedCellPosNearResolvedPos = ($pos: ResolvedPos) => {
  // look at positions immediately after
  for(let after = $pos.nodeAfter, pos = $pos.pos; after; after = after.firstChild, pos++) {
    const role = after.type.spec.tableRole;

    if(role === TableRole.Cell || role === TableRole.HeaderCell) {
      return $pos.doc.resolve(pos);
    } /* else -- Node has no TableRole */
  }

  // look at positions that are before the given one
  for(let before = $pos.nodeBefore, pos = $pos.pos; before; before = before.lastChild, pos--) {
    const role = before.type.spec.tableRole;
    if(role == TableRole.Cell || role == TableRole.HeaderCell) {
      return $pos.doc.resolve(pos - before.nodeSize);
    } /* else -- Node has no TableRole */
  }

  return/*default undefined*/;
};

/** return whether the given {@link ResolvedPos} points at a Cell */
export const isResolvedPosPointingAtCell = ($pos: ResolvedPos) => $pos.parent.type.spec.tableRole === TableRole.Row && $pos.nodeAfter/*there is a Cell*/;

/** return a {@link ResolvedPos} that points past its nodeAfter */
export const moveResolvedCellPosForward = ($pos: ResolvedPos) => $pos.nodeAfter && $pos.node(0/*the document*/).resolve($pos.pos + $pos.nodeAfter.nodeSize);

/**
 * get the {@link TableRect} of the Cell at the given {@link ResolvedPos}
 */
export const getCellTableRect = ($pos: ResolvedPos) => {
  const tableMap = TableMap.getTableMap($pos.node(-1));
  return tableMap.getCellTableRect($pos.pos - $pos.start(-1));
};

/**
 * get the absolute position of the Cell at the given {@link ResolvedPos}
 * after moving it
 */
export const getMovedCellResolvedPos = ($pos: ResolvedPos, axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/bottom*/) => {
  const tableMap = TableMap.getTableMap($pos.node(-1/*grandParent*/)),
        tableStart = $pos.start(-1/*grandParent depth*/);

  const movedPosition = tableMap.getNextCellPos($pos.pos - tableStart, axis, direction);
  return movedPosition === null ? null : $pos.node(0/*the doc*/).resolve(tableStart + movedPosition);
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

  const table = cellPos.node(-1/*grandParent*/),
        tableStart = cellPos.start(-1/*grandParent depth*/),
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

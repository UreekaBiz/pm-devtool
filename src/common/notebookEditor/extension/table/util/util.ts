import { Attrs, Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Attributes, AttributeType } from '../../../attribute';
import { isCellSelection, isNodeSelection } from '../../../selection';
import { CellSelection, TableMap, TableRect } from '../class';
import { getHeaderCellNodeType } from '../node/headerCell';
import { TableRole } from '../type';

// ********************************************************************************
// == Table =======================================================================
/** check if the head of the {@link EditorState} Selection is in a Table */
export const isInTable = (state: EditorState) => {
  const { $head } = state.selection;
  for(let d = $head.depth; d > 0/*not the top level (Document)*/; d--) {
    if($head.node(d).type.spec.tableRole === TableRole.Row) {
      return true;
    } /* else -- Node at depth is not a Row */
  }

  return false /*default*/;
};

/** check if the two given {@link ResolvedPos} objs are in the same Table Node */
export const inSameTable = ($a: ResolvedPos, $b: ResolvedPos) => {
  return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1);
};

// == Column ======================================================================
/** return the column count of the Table at the given {@link ResolvedPos} */
export const colCount = ($pos: ResolvedPos) => {
  const map = TableMap.get($pos.node(-1));
  return map.colCount($pos.pos - $pos.start(-1));
};

export const addColSpan = (attrs: Partial<Attributes>, pos: number, n = 1) => {
  const result = setTableNodeAttributes(attrs, AttributeType.ColSpan, attrs[AttributeType.ColSpan] + n);

  if(result[AttributeType.ColWidth]) {
    result[AttributeType.ColWidth] = result[AttributeType.ColWidth].slice();
    for(let i = 0; i < n; i++) {
      result[AttributeType.ColWidth].splice(pos, 0/*do not remove anything*/, 0/*add a 0*/);
    }
  }

  return result;
};

export const removeColSpan = (attrs: Partial<Attributes>, pos: number, n = 1) => {
  const result = setTableNodeAttributes(attrs, AttributeType.ColSpan, attrs[AttributeType.ColSpan] - n);

  if(result[AttributeType.ColWidth]) {
    result[AttributeType.ColWidth] = result[AttributeType.ColWidth].slice();
    result[AttributeType.ColWidth].splice(pos, n);

    if(!result[AttributeType.ColWidth].some((w: number) => w > 0)) {
      result[AttributeType.ColWidth] = null;
    } /* else -- at least one of the colWidth array items is bigger than 0 */
  } /* else -- colWidth attribute is undefined */

  return result;
};

/** check if a column is a header column */
export const columnIsHeader = (map: TableMap, table: ProseMirrorNode, col: number) => {
  const headerCellType = getHeaderCellNodeType(table.type.schema);

  for(let row = 0; row < map.height; row++) {
    if(table.nodeAt(map.map[col + row * map.width])?.type !== headerCellType) {
      return false;
    } /* else -- Node is a headerCell */
  }

  return true/*default*/;
};

// == Cell ========================================================================
export const cellAround = ($pos: ResolvedPos) => {
  for(let d = $pos.depth - 1; d > 0; d--) {
    if($pos.node(d).type.spec.tableRole === TableRole.Row) {
      return $pos.node(0).resolve($pos.before(d + 1));
    } /* else -- Node has no tableRole */
  }

  return null/*default*/;
};

export const findCellWrapperNode = ($pos: ResolvedPos) => {
  for(let d = $pos.depth; d > 0; d--) {
    // it is possible for Cell to be at the same depth
    const role = $pos.node(d).type.spec.tableRole;

    if(role === TableRole.HeaderCell || role === TableRole.Cell) {
      return $pos.node(d);
    } /* else -- keep looking upwards through depth */
  }

  return null/*default*/;
};

export const selectionCell = (state: EditorState) => {
  const { selection } = state;

  if('$anchorCell' in selection) {
    const { $anchorCell, $headCell } = selection as CellSelection;
    return $anchorCell.pos > $headCell.pos
      ? $anchorCell
      : $headCell;

  } else if(isNodeSelection(selection) && selection.node && selection.node.type.spec.tableRole === TableRole.Cell) {
    return selection.$anchor;
  }

  return cellAround(selection.$head) || cellNear(selection.$head);
};
const cellNear = ($pos: ResolvedPos) => {
  for(let after = $pos.nodeAfter, pos = $pos.pos; after; after = after.firstChild, pos++) {
    const role = after.type.spec.tableRole;

    if(role === TableRole.Cell || role === TableRole.HeaderCell) {
      return $pos.doc.resolve(pos);
    } /* else -- Node has no TableRole */
  }

  for(let before = $pos.nodeBefore, pos = $pos.pos; before; before = before.lastChild, pos--) {
    const role = before.type.spec.tableRole;
    if(role == TableRole.Cell || role == TableRole.HeaderCell) {
      return $pos.doc.resolve(pos - before.nodeSize);
    } /* else -- Node has no TableRole */
  }

  return/*default undefined*/;
};

export const pointsAtCell = ($pos: ResolvedPos) => $pos.parent.type.spec.tableRole === TableRole.Row && $pos.nodeAfter;

export const moveCellForward = ($pos: ResolvedPos) => $pos.nodeAfter && $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize);

export const findCell = ($pos: ResolvedPos) => {
  const map = TableMap.get($pos.node(-1));
  return map.findCell($pos.pos - $pos.start(-1));
};

export const nextCell = ($pos: ResolvedPos, axis: 'horizontal' | 'vertical', dir: 1 | -1) => {
  const start = $pos.start(-1);

  const map = TableMap.get($pos.node(-1));
  const moved = map.nextCell($pos.pos - start, axis, dir);
  return moved === null ? null : $pos.node(0).resolve(start + moved);
};

// == Rect ========================================================================
/**
 * get the selected Rectangle in a Table if any, adding the TableMap,
 * TableNode, and TableStartOffset to the object for convenience.
 */
 export const selectedRect = (state: EditorState) => {
  const { selection } = state;
  const $pos = selectionCell(state);
  if(!$pos) return null/*selection not in a Cell*/;

  const table = $pos.node(-1);
  const tableStart = $pos.start(-1);
  const tableMap = TableMap.get(table);

  let rect: TableRect;
  if(isCellSelection(selection)) { rect = tableMap.rectBetween(selection.$anchorCell.pos - tableStart, selection.$headCell.pos - tableStart); }
  else { rect = tableMap.findCell($pos.pos - tableStart); }

  rect.tableStart = tableStart;
  rect.tableMap = tableMap;
  rect.table = table;
  return rect;
};

// == Attr ========================================================================
export const setTableNodeAttributes = (attrs: Attrs, name: string, value: any) => {
  const result: Record<string, any> = {};

  for(let prop in attrs) {
    result[prop] = attrs[prop];
  }

  result[name] = value;
  return result;
};

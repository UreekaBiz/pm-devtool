import { Node as ProseMirrorNode } from 'prosemirror-model';

import { Attributes, AttributeType } from '../../../attribute';
import { TableRole, TableProblem } from '../type';
import { TableRect } from './TableRect';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/tablemap.js

// this code builds up a descriptive structure for a given
// Table node. The structures are cached with the (persistent) Table
// Nodes as key, so that they only have to be recomputed when the
// content of the Table changes

// this means that they have to store Table-relative, not
// Document-relative positions, so code that uses them will typically
// compute the start position of the Table and offset positions passed
// to or gotten from this structure by that amount

// == Type ========================================================================
type CollisionProblemType = { type: TableProblem.Collision; row: number; position: number; n: number; };
type ColWidthMismatchProblemType = { type: TableProblem.ColWidthMistMatch; position: number; colWidth: number[]; };
type MissingProblemType = { type: TableProblem.Missing; row: number; n: number; };
type OverlongRowspanProblemType = { type: TableProblem.OverlongRowSpan; position: number; n: number; };
type ProblemType = CollisionProblemType | ColWidthMismatchProblemType | MissingProblemType | OverlongRowspanProblemType;

// == Cache =======================================================================
const cache = new WeakMap<ProseMirrorNode, TableMap>();
const readFromCache = (key: ProseMirrorNode) => cache.get(key);
const addToCache = (key: ProseMirrorNode, value: TableMap) => {
  cache.set(key, value);
  return value;
};

// == TableMap Class ==============================================================
// ::- A table map describes the structure of a given table. To avoid
// recomputing them all the time, they are cached per table node. To
// be able to do that, positions saved in the map are relative to the
// start of the table, rather than the start of the document.
/**
 * a TableMap describes the structure of a given Table. To avoid
 * recomputing them all the time, they are cached per Table Node. To
 * do that, positions saved in the Map are relative to the start of the Table,
 * rather than the start of the document
 */
export class TableMap {
  // -- Attribute -----------------------------------------------------------------
  /** the width of the table */
  public width: number;

  /** the height of the table */
  public height: number;

  /*
   * a width * height array with the start position of the Cell covering that part
   * of the table in each slot
   */
  public map: number[];

  /**
   * an optional array of problems (Cell overlap or non-rectangular shape) for
   * the Table, used by the Table normalizer
   */
  public problems: ProblemType[];

  // -- Lifecycle -----------------------------------------------------------------
  constructor(width: number, height: number, map: number[], problems: ProblemType[]) {
    this.width = width;
    this.height = height;
    this.map = map;
    this.problems = problems;
  }

  /** find the dimensions of the Cell at the given position */
  public findCell(pos: number) {
    for(let i = 0; i < this.map.length; i++) {
      const curPos = this.map[i];
      if(curPos !== pos) continue;

      let left = i % this.width;
      let top = (i / this.width) | 0;

      let right = left + 1;
      let bottom = top + 1;

      for(let j = 1; right < this.width && this.map[i + j] === curPos; j++) {
        right++;
      }

      for(let j = 1; bottom < this.height && this.map[i + this.width * j] === curPos; j++) {
        bottom++;
      }

      return new TableRect(left, top, right, bottom);
    }

    throw new RangeError('findCell: No cell with offset ' + pos + ' found');
  }

  /** find the left side of the Cell at the given position */
  public colCount(pos: number) {
    for(let i = 0; i < this.map.length; i++) {
      if(this.map[i] === pos) {
        return i % this.width;
      } /* else -- map at pos is not the looked-for position */
    }

    throw new RangeError('colCount: No cell with offset ' + pos + ' found');
  }

  /**
   * find the next Cell in the given direction, starting from the Cell
   * at the given pos, if any
   */
   public nextCell(pos: number, axis: 'horizontal' | 'vertical', dir: 1 | -1) {
    let { left, right, top, bottom } = this.findCell(pos);
    if(axis === 'horizontal') {
      if(dir < 0 ? left === 0 : right === this.width) {
        return null;
      } /* else -- left is not equal to zero or right equals width */

      return this.map[top * this.width + (dir < 0 ? left - 1 : right)];
    } else {
      if(dir < 0 ? top == 0 : bottom == this.height) {
        return null;
      } /* else -- top is not equal to zero or bottom equals height */

      return this.map[left + this.width * (dir < 0 ? top - 1 : bottom)];
    }
  }

  /** get the {@link TableRect} spanning the two given Cells */
  public rectBetween(firstCellPos: number, secondCellPos: number) {
    const { left: leftA, right: rightA, top: topA, bottom: bottomA } = this.findCell(firstCellPos);
    const { left: leftB, right: rightB, top: topB, bottom: bottomB } = this.findCell(secondCellPos);

    const minLeft = Math.min(leftA, leftB);
    const minTop = Math.min(topA, topB);
    const maxRight = Math.max(rightA, rightB);
    const maxBottom = Math.max(bottomA, bottomB);

    return new TableRect(minLeft, minTop, maxRight, maxBottom);
  }

  /**
   * return the position of all Cells that have the top left corner
   * in the given {@link TableRect}. Recall that the positions are
   * such that they are relative to the start of the Table
   */
  public cellsInRect(rect: TableRect) {
    const result: number[] = [];
    const seen: { [key: number]: boolean; } = {};

    for(let row = rect.top; row < rect.bottom; row++) {
      for(let col = rect.left; col < rect.right; col++) {
        const index = row * this.width + col;
        const pos = this.map[index];

        if(seen[pos]) {
          continue;
        } /* else -- not seen yet */
        seen[pos] = true;

        if((col !== rect.left || !col || this.map[index - 1] !== pos) && (row !== rect.top || !row || this.map[index - this.width] !== pos)) {
          result.push(pos);
        }
      }
    }
    return result;
  }

  /**
   * return the position at which the Cell at the given row and
   * column starts, or would start, if a Cell started there
   */
  public positionAt(row: number, col: number, table: ProseMirrorNode) {
    for(let i = 0, rowStart = 0; ; i++) {
      const rowEnd = rowStart + table.child(i).nodeSize;
      if(i === row) {
        let index = col + row * this.width;
        const rowEndIndex = (row + 1) * this.width;

        // skip past cells from previous rows (via rowSpan)
        while(index < rowEndIndex && this.map[index] < rowStart) {
          index++;
        }

        return index == rowEndIndex ? rowEnd - 1 : this.map[index];
      }

      rowStart = rowEnd;
    }
  }

  /** find the {@link TableMap} for the given TableNode */
  public static get(table: ProseMirrorNode) {
    return readFromCache(table) || addToCache(table, computeMap(table));
  }
}

// == Util ========================================================================
/** compute a {@link TableMap} */
const computeMap = (table: ProseMirrorNode) => {
  if(table.type.spec.tableRole !== TableRole.Table) {
    throw new RangeError('Not a table node: ' + table.type.name);
  } /* else -- given Node is a Table Node */

  const width = findWidth(table),
        height = table.childCount;

  const map = [];
  let mapPos = 0/*default*/;

  const problems: ProblemType[/*default empty*/] = [];
  const colWidths: number[] = [];

  for(let i = 0, e = width * height; i < e; i++) {
    map[i] = 0;
  }

  for(let row = 0, pos = 0; row < height; row++) {
    const rowNode = table.child(row);
    pos++;

    for(let i = 0; ; i++) {
      while(mapPos < map.length && map[mapPos] !== 0) {
        mapPos++;
      }

      if(i === rowNode.childCount) break;

      const cellNode = rowNode.child(i);
      const colSpan = cellNode.attrs[AttributeType.ColSpan];
      const rowSpan = cellNode.attrs[AttributeType.RowSpan];
      const colWidth = cellNode.attrs[AttributeType.ColWidth];
      for(let h = 0; h < rowSpan; h++) {
        if(h + row >= height) {
          problems.push({ type: TableProblem.OverlongRowSpan, position: pos, n: rowSpan - h });
          break;
        } /* else -- h + row is not bigger than or equal to height */


        const start = mapPos + h * width;
        for(let w = 0; w < colSpan; w++) {
          if(map[start + w] == 0) { map[start + w] = pos; }
          else { problems.push({ type: TableProblem.Collision, row, position: pos, n: colSpan - w }); }

          const colW = colWidth && colWidth[w];
          if(colW) {
            const widthIndex = ((start + w) % width) * 2;
            const prev = colWidths[widthIndex];

            if(prev === null || (prev !== colW && colWidths[widthIndex + 1] == 1)) {
              colWidths[widthIndex] = colW;
              colWidths[widthIndex + 1] = 1;
            } else if(prev === colW) {
              colWidths[widthIndex + 1]++;
            } /* else -- prev is not equal to colW */
          } /* else -- colW is 0 or undefined */
        }
      }

      mapPos += colSpan;
      pos += cellNode.nodeSize;
    }

    const expectedPos = (row + 1) * width;

    let missing = 0;
    while(mapPos < expectedPos) {
      if(map[mapPos++] === 0) {
        missing++;
      } /* else -- result from incrementing map at mapPos+1 is not 0 */
    }

    if(missing) {
      problems.push({ type: TableProblem.Missing, row, n: missing });
    } /* else -- no missing problems */

    pos++;
  }

  const tableMap = new TableMap(width, height, map, problems);

  // for columns that have defined widths, but whose widths disagree
  // between rows, fix up the cells whose width does not match the computed one
  let badWidths = false/*default*/;
  for(let i = 0; !badWidths && i < colWidths.length; i += 2) {
    if(colWidths[i] !== null && colWidths[i + 1] < height) {
      badWidths = true;
    } /* else -- not a bad width */
  }

  if(badWidths) {
    findBadColWidths(tableMap, colWidths, table);
  } /* else -- no bad column widths */

  return tableMap;
};

/** find the width of a Table Node */
const findWidth = (table: ProseMirrorNode) => {
  let width = -1/*default*/;
  let hasRowSpan = false/*default*/;

  for(let row = 0; row < table.childCount; row++) {
    let rowNode = table.child(row);
    let rowWidth = 0/*default*/;

    if(hasRowSpan) {
      for(let j = 0; j < row; j++) {
        const prevRow = table.child(j);

        for(let i = 0; i < prevRow.childCount; i++) {
          const cell = prevRow.child(i);
          if(j + cell.attrs[AttributeType.RowSpan] > row) {
            rowWidth += cell.attrs[AttributeType.ColSpan];
          } /* else -- no need to increase rowWidth */
        }
      }
    } /* else -- no rowSpan */

    for(let i = 0; i < rowNode.childCount; i++) {
      const cell = rowNode.child(i);
      rowWidth += cell.attrs[AttributeType.ColSpan];
      if(cell.attrs[AttributeType.RowSpan] > 1) {
        hasRowSpan = true;
      } /* else -- rowSpan is not greater than 1 */
    }

    if(width === -1) {
      width = rowWidth;
    } else if(width !== rowWidth) {
      width = Math.max(width, rowWidth);
    } /* else -- do not change default width */
  }
  return width;
};

const findBadColWidths = (map: TableMap, colWidths: number[], table: ProseMirrorNode) => {
  if(!map.problems) {
    map.problems = [/*default empty*/];
  } /* else -- problems array already defined */

  for(let i = 0, seen: { [key: number]: boolean; } = {}; i < map.map.length; i++) {
    const pos = map.map[i];
    if(seen[pos]) continue/*already seen*/;

    seen[pos] = true;
    const node = table.nodeAt(pos);
    let updated = null/*default*/;

    for(let j = 0; j < node?.attrs[AttributeType.ColSpan]; j++) {
      const col = (i + j) % map.width;
      const colWidth = colWidths[col * 2];

      if(colWidth !== null && node && (!node.attrs[AttributeType.ColWidth] || node.attrs[AttributeType.ColWidth][j] !== colWidth)) {
        (updated || (updated = freshColWidth(node.attrs)))[j] = colWidth;
      } /* else -- colWidth is null, node does not exist, or the colWidth attrs is non-existent or does not match colWidth in position j */
    }

    if(updated) {
      map.problems.unshift({ type: TableProblem.ColWidthMistMatch, position: pos, colWidth: updated });
    } /* else -- updated is default (null) */
  }
};

/**
 * compute a columnWidth represented as a number array given the
 * colWidth attribute of the attrs object or the colSpan attr if
 * colWidth is not defined
 */
const freshColWidth = (attrs: Partial<Attributes>): number[] => {
  if(attrs[AttributeType.ColWidth]) return attrs[AttributeType.ColWidth].slice();

  const result: number[] = [];
  for(let i = 0; i < attrs[AttributeType.ColSpan]; i++) {
    result.push(0);
  }

  return result;
};


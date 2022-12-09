import { Node as ProseMirrorNode } from 'prosemirror-model';

import { Attributes, AttributeType } from '../../../attribute';
import { isTableNode } from '../node';
import { TableProblem } from '../type';
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
type CollisionProblemType = { type: TableProblem.Collision; row: number; position: number; amount: number; };
type ColWidthMismatchProblemType = { type: TableProblem.ColWidthMistMatch; position: number; colWidth: number[]; };
type MissingProblemType = { type: TableProblem.Missing; row: number; amount: number; };
type OverlongRowspanProblemType = { type: TableProblem.OverlongRowSpan; position: number; amount: number; };
type TableMapProblemType = CollisionProblemType | ColWidthMismatchProblemType | MissingProblemType | OverlongRowspanProblemType;

// == Cache =======================================================================
const tableMapCache = new WeakMap<ProseMirrorNode, TableMap>();
const readFromTableMapCache = (key: ProseMirrorNode) => tableMapCache.get(key);
const addToTableMapCache = (key: ProseMirrorNode, value: TableMap) => {
  tableMapCache.set(key, value);
  return value;
};

// == TableMap Class ==============================================================
// a TableMap represents the structure of a Table Node. Positions saved in its map
// are relative to the start of the Table Node, not the start of the Document
export class TableMap {
  // -- Attribute -----------------------------------------------------------------
  /** the width of the Table Node */
  public width: number;

  /** the height of the Table Node */
  public height: number;

  /*
   * a width * height array with the start position of the (i.e. 1 position before
   * the Cell position) covering that part of the Table Node in each slot
   */
  public map: number[];

  /**
   * an optional array of problems (Cell overlap or non-rectangular shape) for
   * the Table, used by the Table normalizer
   */
  public problems: TableMapProblemType[];

  // -- Lifecycle -----------------------------------------------------------------
  constructor(width: number, height: number, map: number[], problems: TableMapProblemType[]) {
    this.width = width;
    this.height = height;
    this.map = map;
    this.problems = problems;
  }

  /** get the {@link TableRect} of the Cell at the given position, relative to the Table */
  public getCellTableRect(cellPos: number) {
    for(let i = 0; i < this.map.length; i++) {
      const cursorPos = this.map[i];
      if(cursorPos !== cellPos) continue/*no Cell at cursor*/;

      let left = i % this.width,
          top = (i / this.width) | 0/*default*/,
          right = left + 1/*by definition*/,
          bottom = top + 1/*by definition*/;

      for(let j = 1; right < this.width && this.map[i + j] === cursorPos; j++) {
        right++;
      }

      for(let j = 1; bottom < this.height && this.map[i + this.width * j] === cursorPos; j++) {
        bottom++;
      }

      return new TableRect(left, top, right, bottom);
    }

    throw new RangeError('getCellTableRect: No Cell with offset ' + cellPos + ' found');
  }

  /** get the amount of columns that lie before the cell at the given position */
  public getColumnAmountBeforePos(cellPos: number) {
    for(let i = 0; i < this.map.length; i++) {
      if(this.map[i] === cellPos) {
        return i % this.width;
      } /* else -- map at pos is not the looked-for position */
    }

    throw new RangeError('getColumnAmountBeforePos: No cell with offset ' + cellPos + ' found');
  }

  /**
   * find the position of the next Cell in the given direction,
   * starting from the Cell at the given position, if any
   */
   public getNextCellPos(startingCellPos: number, axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*down/right*/) {
    let { left, right, top, bottom } = this.getCellTableRect(startingCellPos);

    if(axis === 'horizontal') {
      if(direction < 0 ? left === 0 : right === this.width) {
        return null/*by definition there cannot be a Cell to the left or to the right*/;
      } /* else -- left is not equal to zero or right does not equal width */

      return this.map[top * this.width + (direction < 0 ? left - 1/*previous*/ : right/*next*/)];
    } else {
      if(direction < 0 ? top === 0 : bottom === this.height) {
        return null/*by definition there cannot be a Cell above or below*/;
      } /* else -- top is not equal to zero or bottom does not equal height */

      return this.map[left + this.width * (direction < 0 ? top - 1/*above*/ : bottom/*below*/)];
    }
  }

  /** get the {@link TableRect} spanning the two given Cells */
  public getTableRectBetweenCellPositions(firstCellPos: number, secondCellPos: number) {
    const { left: leftA, right: rightA, top: topA, bottom: bottomA } = this.getCellTableRect(firstCellPos),
          { left: leftB, right: rightB, top: topB, bottom: bottomB } = this.getCellTableRect(secondCellPos);

    const minLeft = Math.min(leftA, leftB),
          minTop = Math.min(topA, topB),
          maxRight = Math.max(rightA, rightB),
          maxBottom = Math.max(bottomA, bottomB);

    return new TableRect(minLeft, minTop, maxRight, maxBottom);
  }

  /**
   * return the position of all Cells that have the top left corner
   * in the given {@link TableRect}
   */
  public getCellsInTableRect(tableRect: TableRect) {
    const cellPositions: number[] = [/*default empty*/],
          seenCellPositions: { [key: number]: boolean; } = {/*default empty*/};

    for(let row = tableRect.top; row < tableRect.bottom; row++) {
      for(let column = tableRect.left; column < tableRect.right; column++) {
        const indexOfCell = row * this.width + column;
        const cellPos = this.map[indexOfCell];

        if(seenCellPositions[cellPos]) continue/*already seen*/;

        seenCellPositions[cellPos] = true/*by definition*/;
        if((column !== tableRect.left || !column || this.map[indexOfCell - 1/*account for 0 indexing*/] !== cellPos) && (row !== tableRect.top || !row || this.map[indexOfCell - this.width] !== cellPos)) {
          cellPositions.push(cellPos);
        }
      }
    }
    return cellPositions;
  }

  /**
   * return the position at which the Cell at the given row and
   * column starts, or would start, if any
   */
  public cellPositionAt(table: ProseMirrorNode, row: number, column: number) {
    for(let rowIndex = 0, rowStart = 0; ; rowIndex++) {
      const rowEnd = rowStart + table.child(rowIndex).nodeSize;
      if(rowIndex === row) {
        let cellIndex = column + row * this.width;
        const rowEndIndex = (row + 1/*account for 0 indexing*/) * this.width;

        // skip past cells from previous rows using the rowSpan
        while(cellIndex < rowEndIndex && this.map[cellIndex] < rowStart) {
          cellIndex++;
        }

        return cellIndex == rowEndIndex ? rowEnd - 1 : this.map[cellIndex];
      }

      rowStart = rowEnd;
    }
  }

  /** find the {@link TableMap} for the given TableNode */
  public static getTableMap(table: ProseMirrorNode) {
    return readFromTableMapCache(table) || addToTableMapCache(table, computeTableMap(table));
  }
}

// == Util ========================================================================
/** compute a {@link TableMap} */
const computeTableMap = (table: ProseMirrorNode) => {
  if(!isTableNode(table)) {
    throw new RangeError('Not a table node: ' + table.type.name);
  } /* else -- given Node is a Table Node */

  const tableWidth = getTableWidth(table),
        tableHeight = table.childCount;

  const map = [/*default empty*/];
  let mapIndexPosition = 0/*default*/;

  const problems: TableMapProblemType[] = [/*default empty*/];
  const columnWidths: number[] = [/*default empty*/];

  for(let i = 0, tableArea = tableWidth * tableHeight; i < tableArea; i++) {
    map[i] = 0/*default*/;
  }

  for(let rowIndex = 0, rowPos = 0; rowIndex < tableHeight; rowIndex++) {
    const rowNode = table.child(rowIndex);
    rowPos++;

    for(let cellIndex = 0; ; cellIndex++) {
      while(mapIndexPosition < map.length && map[mapIndexPosition] !== 0/*already initialized*/) {
        mapIndexPosition++;
      }

      if(cellIndex === rowNode.childCount) break;

      const cellNode = rowNode.child(cellIndex),
            cellColumnSpan = cellNode.attrs[AttributeType.ColSpan],
            cellRowSpan = cellNode.attrs[AttributeType.RowSpan],
            cellColumnWidth = cellNode.attrs[AttributeType.ColWidth];

      for(let currentCellRowSpan = 0; currentCellRowSpan < cellRowSpan; currentCellRowSpan++) {
        if(currentCellRowSpan + rowIndex >= tableHeight) {
          problems.push({ type: TableProblem.OverlongRowSpan, position: rowPos, amount: cellRowSpan - currentCellRowSpan });
          break;
        } /* else -- currentTableHeight + rowIndex is not bigger than or equal to height */

        // the position (in the map, i.e. from 0-tableCellAmount) where the current Cell starts
        const cellStartIndexInMap = mapIndexPosition + (currentCellRowSpan * tableWidth);

        for(let currentCellColumnSpan = 0; currentCellColumnSpan < cellColumnSpan; currentCellColumnSpan++) {
          if(map[cellStartIndexInMap + currentCellColumnSpan] === 0/*not initialized yet*/) { map[cellStartIndexInMap + currentCellColumnSpan] = rowPos; }
          else { problems.push({ type: TableProblem.Collision, row: rowIndex, position: rowPos, amount: cellColumnSpan - currentCellColumnSpan }); }

          const columnWidth = cellColumnWidth && cellColumnWidth[currentCellColumnSpan];
          if(columnWidth) {
            const columnWidthIndex = ((cellStartIndexInMap + currentCellColumnSpan) % tableWidth) * 2;
            const previousColumnWidth = columnWidths[columnWidthIndex];

            if(previousColumnWidth === null || (previousColumnWidth !== columnWidth && columnWidths[columnWidthIndex + 1] === 1)) {
              columnWidths[columnWidthIndex] = columnWidth;
              columnWidths[columnWidthIndex + 1] = 1;
            } else if(previousColumnWidth === columnWidth) {
              columnWidths[columnWidthIndex + 1]++;
            } /* else -- previousWidth is not equal to columnWidth */
          } /* else -- columnWidth is 0 or undefined */
        }
      }

      mapIndexPosition += cellColumnSpan;
      rowPos += cellNode.nodeSize;
    }

    const expectedRowIndex = (rowIndex + 1/*account for 0 indexing*/) * tableWidth;
    let missingCellAmount = 0/*default*/;
    while(mapIndexPosition < expectedRowIndex) {
      if(map[mapIndexPosition++] === 0) {
        missingCellAmount++;
      } /* else -- result from incrementing map at mapPos+1 is not 0 */
    }

    if(missingCellAmount) {
      problems.push({ type: TableProblem.Missing, row: rowIndex, amount: missingCellAmount });
    } /* else -- no missing problems */

    rowPos++;
  }

  const tableMap = new TableMap(tableWidth, tableHeight, map, problems);

  // modify the Cells whose with does not match the computed columnWidth
  // when said width is defined
  let hasBadWidths = false/*default*/;
  for(let i = 0; !hasBadWidths && i < columnWidths.length; i += 2) {
    if(columnWidths[i] !== null && columnWidths[i + 1] < tableHeight) {
      hasBadWidths = true;
    } /* else -- not a bad width */
  }

  if(hasBadWidths) {
    findBadColumnWidths(table, tableMap, columnWidths);
  } /* else -- no bad column widths */

  return tableMap;
};

/** find the width of a Table Node */
const getTableWidth = (table: ProseMirrorNode) => {
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

    if(width === -1/*default*/) {
      width = rowWidth;
    } else if(width !== rowWidth) {
      width = Math.max(width, rowWidth);
    } /* else -- do not change default width */
  }
  return width;
};

const findBadColumnWidths = (table: ProseMirrorNode, tableMap: TableMap, columnWidths: number[]) => {
  if(!tableMap.problems) {
    tableMap.problems = [/*default empty*/];
  } /* else -- problems array already defined */

  for(let i = 0, seenCellPositions: { [key: number]: boolean; } = {}; i < tableMap.map.length; i++) {
    const cellPos = tableMap.map[i];
    if(seenCellPositions[cellPos]) continue/*already seen*/;

    seenCellPositions[cellPos] = true;
    const cellNode = table.nodeAt(cellPos);
    let updated = null/*default*/;

    for(let j = 0; j < cellNode?.attrs[AttributeType.ColSpan]; j++) {
      const column = (i + j) % tableMap.width,
            columnWidth = columnWidths[column * 2];

      if(columnWidth !== null && cellNode && (!cellNode.attrs[AttributeType.ColWidth] || cellNode.attrs[AttributeType.ColWidth][j] !== columnWidth)) {
        (updated || (updated = createDefaultColumnWidthsArray(cellNode.attrs)))[j] = columnWidth;
      } /* else -- columnWidth is null, cellNode does not exist, or the columnWidth attrs is non-existent or does not match columnWidth in position j */
    }

    if(updated) {
      tableMap.problems.unshift({ type: TableProblem.ColWidthMistMatch, position: cellPos, colWidth: updated });
    } /* else -- updated is default (null) */
  }
};

/**
 * create a columnWidth array given the columnWidth attribute of the
 * given attributes object or the colSpan attribute if the columnWidth
 * one is not defined
 */
const createDefaultColumnWidthsArray = (attrs: Partial<Attributes>): number[] => {
  if(attrs[AttributeType.ColWidth]) return attrs[AttributeType.ColWidth].slice(/*copy*/);

  const columnWidths: number[] = [];
  for(let i = 0; i < attrs[AttributeType.ColSpan]; i++) {
    columnWidths.push(0/*default*/);
  }

  return columnWidths;
};


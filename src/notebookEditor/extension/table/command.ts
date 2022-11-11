import { Fragment, Node as ProseMirrorNode, NodeType, ResolvedPos } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';

import { addColSpan, cellAround, cellWrapping, columnIsHeader, getTableNodeTypes, isCellSelection, isInTable, moveCellForward, removeColSpan, selectionCell, setTableNodeAttributes, CellSelection, AttributeType, DispatchType, NodeName, TableMap, TableRole, TableRect } from 'common';

// ********************************************************************************
// == Type ========================================================================
type OptionalRectProps = { table: ProseMirrorNode | null | undefined; tableMap: TableMap | null | undefined; tableStart: number | null | undefined; };

// == Table =======================================================================
/** deletes the Table around the Selection, if any */
export const deleteTable = (state: EditorState, dispatch: DispatchType) => {
  const $pos = state.selection.$anchor;

  for(let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if(node.type.spec.tableRole === TableRole.Table) {
      if(dispatch)
        dispatch(state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView());
      return true/*handled*/;
    } /* else -- not a Table, do nothing */
  }

  return false/*not handled*/;
};

// == Column ======================================================================
/** add a Column at the given position in a Table Node */
export const addColumn = (tr: Transaction, { table, tableMap, tableStart }: OptionalRectProps, col: number) => {
  if(!table || !tableMap || !tableStart) return tr/*do nothing*/;

  let referenceColumn: number | null = col > 0 ? -1 : 0;
  if(columnIsHeader(tableMap, table, col + referenceColumn)) {
    referenceColumn = col == 0 || col == tableMap.width ? null : 0;
  } /* else -- computed column is not a Header */

  for(let row = 0; row < tableMap.height; row++) {
    const index = row * tableMap.width + col;

    // if the position falls inside a column spanning Cell
    if(col > 0 && col < tableMap.width && tableMap.map[index - 1] == tableMap.map[index]) {
      let pos = tableMap.map[index];
      const cell = table.nodeAt(pos);
      if(!cell) continue/*nothing to do*/;

      tr.setNodeMarkup(tr.mapping.map(tableStart + pos), null/*maintain type*/, addColSpan(cell.attrs, col - tableMap.colCount(pos)));
      // skip ahead if rowSpan > 1
      row += cell.attrs[AttributeType.RowSpan] - 1;

    } else {
      const type =
        referenceColumn == null
          ? getTableNodeTypes(table.type.schema)[NodeName.CELL]
          : table.nodeAt(tableMap.map[index + referenceColumn])?.type;

      const mappedPos = tableMap.positionAt(row, col, table);

      const nodeOfType = type?.createAndFill();
      if(nodeOfType) {
        tr.insert(tr.mapping.map(tableStart + mappedPos), nodeOfType);
      } /* else -- could not create Node, do not insert anything */
    }
  }

  return tr;
};

/** add a column before the column with the Selection */
export const addColumnBefore = (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const rect = selectedRect(state);
    if(!rect) return false/*no selected Rectangle in Table*/;

    dispatch(addColumn(state.tr, rect, rect.left));
  }
  return true;
};

/** add a column after the column with the Selection */
export const addColumnAfter = (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const rect = selectedRect(state);
    if(!rect) return false/*no selected Rectangle in Table*/;

    dispatch(addColumn(state.tr, rect, rect.right));
  }
  return true;
};

export const removeColumn = (tr: Transaction, { table, tableMap, tableStart }: OptionalRectProps, col: number) => {
  if(!table || !tableMap || !tableStart) return/*do nothing*/;

  const mapStart = tr.mapping.maps.length;
  for(let row = 0; row < tableMap.height;) {
    const index = row * tableMap.width + col;
    const pos = tableMap.map[index];

    const cell = table.nodeAt(pos);
    if(!cell) continue/*nothing to do*/;

    // if this is part of a col-spanning cell
    if((col > 0 && tableMap.map[index - 1] == pos) || (col < tableMap.width - 1 && tableMap.map[index + 1] == pos)) {
      tr.setNodeMarkup(tr.mapping.slice(mapStart).map(tableStart + pos), null/*maintain type*/, removeColSpan(cell.attrs, col - tableMap.colCount(pos)));
    } else {
      const start = tr.mapping.slice(mapStart).map(tableStart + pos);
      tr.delete(start, start + cell.nodeSize);
    }
    row += cell.attrs.rowspan;
  }
};

/** remove the selected columns from a Table */
export const deleteColumn = (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const rect = selectedRect(state);
    if(!rect) return false/*no selected Rectangle in Table*/;
    if(!rect.table || !rect.tableMap || !rect.tableStart) return false/*cannot use Rect*/;

    if(rect.left === 0 && rect.right === rect.tableMap.width) return false/*do nothing*/;

    const { tr } = state;
    for(let i = rect.right - 1; ; i--) {
      removeColumn(tr, rect, i);
      if(i === rect.left) break/*nothing left to do*/;

      rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
      if(!rect.table) return false/*Table does not exist*/;

      rect.tableMap = TableMap.get(rect.table);
    }

    dispatch(tr);
  }

  return true/*handled*/;
};

// == Row =========================================================================
export const rowIsHeader = (map: TableMap, table: ProseMirrorNode, row: number) => {
  const headerCellType = getTableNodeTypes(table.type.schema)[NodeName.HEADER_CELL];

  for(let col = 0; col < map.width; col++) {
    const cellAt = table.nodeAt(map.map[col + row * map.width]);
    if(!cellAt) return false/*by definition*/;

    if(!(cellAt.type === headerCellType)) return false/*not a header Cell*/;
  }

  return true/*row is Header*/;
};

export const addRow = (tr: Transaction, { tableMap, tableStart, table }: OptionalRectProps, row: number) => {
  if(!tableMap || !tableStart || !table) return tr/*do nothing*/;

  let rowPos: number | null | undefined = tableStart;
  for(let i = 0; i < row; i++) {
    rowPos += table.child(i).nodeSize;
  }

  const cells: ProseMirrorNode[] = [];
  let refRow: number | null = row > 0 ? -1 : 0;
  if(rowIsHeader(tableMap, table, row + refRow)) {
    refRow = row == 0 || row === tableMap.height ? null : 0;
  } /* else -- row is not a Header */

  for(let col = 0, index = tableMap.width * row; col < tableMap.width; col++, index++) {

    // covered by a rowspan cell
    if(row > 0 && row < tableMap.height && tableMap.map[index] === tableMap.map[index - tableMap.width]) {
      const pos = tableMap.map[index];
      const node = table.nodeAt(pos);
      if(!node) continue/*nothing to do*/;

      const { attrs } = node;
      tr.setNodeMarkup(tableStart + pos, null/*maintain type*/, setTableNodeAttributes(attrs, AttributeType.RowSpan, attrs[AttributeType.RowSpan] + 1));
      col += attrs.colspan - 1;
    } else {
      const type =
        refRow == null
          ? getTableNodeTypes(table.type.schema).cell
          : table.nodeAt(tableMap.map[index + refRow * tableMap.width])?.type;

      if(type) {
        const nodeOfType = type.createAndFill();
        if(!nodeOfType) continue/*could not create, nothing to do*/;

        cells.push(nodeOfType);
      } /* else -- no type to create */
    }
  }

  tr.insert(rowPos, getTableNodeTypes(table.type.schema)[NodeName.ROW].create(null/*no attrs*/, cells));
  return tr;
};

/** add a Table Row before the Selection */
export const addRowBefore = (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const rect = selectedRect(state);
    if(!rect) return false/*no selected Rectangle in Table*/;

    dispatch(addRow(state.tr, rect, rect.top));
  }
  return true;
};

/** add a Table Row after the Selection */
export const addRowAfter = (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const rect = selectedRect(state);
    if(!rect) return false/*no selected Rectangle in Table*/;

    dispatch(addRow(state.tr, rect, rect.bottom));
  }
  return true;
};

export const removeRow = (tr: Transaction, { tableMap, table, tableStart }: OptionalRectProps, row: number) => {
  if(!table || !tableMap || !tableStart) return/*do nothing*/;

  let rowPos = 0;
  for(let i = 0; i < row; i++) {
    rowPos += table.child(i).nodeSize;
  }

  const nextRow = rowPos + table.child(row).nodeSize;
  const mapFrom = tr.mapping.maps.length;

  tr.delete(rowPos + tableStart, nextRow + tableStart);
  for(let col = 0, index = row * tableMap.width; col < tableMap.width; col++, index++) {
    const pos = tableMap.map[index];
    if(row > 0 && pos == tableMap.map[index - tableMap.width]) {
      // if the cell starts in the Row above, reduce its rowSpan
      const cell = table.nodeAt(pos);
      if(!cell) continue/*nothing to do*/;

      const { attrs } = cell;
      tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + tableStart), null/*maintain type*/, setTableNodeAttributes(attrs, AttributeType.RowSpan, attrs[AttributeType.RowSpan] - 1));
      col += attrs.colspan - 1;

    } else if(row < tableMap.width && pos == tableMap.map[index + tableMap.width]) {
      // if it continues in the Row below, it has to be moved down
      const cell = table.nodeAt(pos);
      if(!cell) continue/*nothing to do*/;

      const { attrs } = cell;
      const cellCopy = cell.type.create(setTableNodeAttributes(attrs, AttributeType.RowSpan, cell.attrs[AttributeType.RowSpan] - 1), cell.content);

      const newPos = tableMap.positionAt(row + 1, col, table);
      tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), cellCopy);
      col += cell.attrs.colspan - 1;
    } /* else -- do nothing */
  }
};

/** remove the selected Rows from a Table */
export const deleteRow = (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const rect = selectedRect(state);
    if(!rect || !rect.table || !rect.tableMap) return false/*no selected Rectangle in Table*/;
    if(rect.top === 0 && rect.bottom === rect.tableMap.height) return false/*nothing to do*/;

    const { tr } = state;
    for(let i = rect.bottom - 1; ; i--) {
      removeRow(tr, rect, i);
      if(i === rect.top) break/*nothing left to do*/;

      rect.table = rect.tableStart
        ? tr.doc.nodeAt(rect.tableStart - 1)
        : tr.doc;
      if(!rect.table) break/*nothing to do */;

      rect.tableMap = TableMap.get(rect.table);
    }

    dispatch(tr);
  }

  return true/*handled*/;
};

// == Cell ========================================================================
const isEmpty = (cell: ProseMirrorNode) => {
  const { content: cellContent } = cell;

  return (cellContent.childCount === 1
    && cellContent.firstChild
    && cellContent.firstChild.isTextblock
    && cellContent.firstChild.childCount === 0
  );
};

const cellsOverlapRectangle = (map: number[], width: number, height: number, rect: TableRect) => {
  let indexTop = rect.top * width + rect.left;
  let indexLeft = indexTop;

  let indexBottom = (rect.bottom - 1) * width + rect.left;
  let indexRight = indexTop + (rect.right - rect.left - 1);

  for(let i = rect.top; i < rect.bottom; i++) {
    if((rect.left > 0 && map[indexLeft] === map[indexLeft - 1]) || (rect.right < width && map[indexRight] === map[indexRight + 1])) {
      return true;
    } /* else -- keep looking */
    indexLeft += width;
    indexRight += width;
  }

  for(let i = rect.left; i < rect.right; i++) {
    if((rect.top > 0 && map[indexTop] === map[indexTop - width]) || (rect.bottom < height && map[indexBottom] === map[indexBottom + width])) {
      return true;
    } /* else -- keep looking */

    indexTop++;
    indexBottom++;
  }


  return false/*default*/;
};

/**
 * merge the selected Cells into a single Cell, only available
 * when the selected Cell's outline forms a Rectangle
 */
export const mergeCells = (state: EditorState, dispatch: DispatchType) => {
  const { selection } = state;
  if(!isCellSelection(selection) || selection.$anchorCell.pos === selection.$headCell.pos) {
    return false;
  } /* else -- can try to merge Cells */

  const rect = selectedRect(state);
  if(!rect || !rect.table || !rect.tableMap || !rect.tableStart) return false/*nothing to do*/;

  const { tableMap } = rect;
  if(cellsOverlapRectangle(tableMap.map, rect.tableMap.width, rect.tableMap.height, rect)) return false/*nothing to do*/;

  if(dispatch) {
    const { tr } = state;
    const seen: { [key: number]: boolean; } = {};

    let content = Fragment.empty;
    let mergedPos, mergedCell;

    for(let row = rect.top; row < rect.bottom; row++) {
      for(let col = rect.left; col < rect.right; col++) {
        const cellPos = tableMap.map[row * tableMap.width + col];
        const cell = rect.table.nodeAt(cellPos);

        if(!cell) continue/*nothing to do*/;
        if(seen[cellPos]) continue/*already seen*/;

        seen[cellPos] = true;
        if(mergedPos === null) {
          mergedPos = cellPos;
          mergedCell = cell;
        } else {
          if(!isEmpty(cell)) content = content.append(cell.content);
          let mapped = tr.mapping.map(cellPos + rect.tableStart);
          tr.delete(mapped, mapped + cell.nodeSize);
        }
      }
    }

    if(!mergedPos || !mergedCell) return false/*could not merge Cells*/;
    tr.setNodeMarkup(mergedPos + rect.tableStart, null, setTableNodeAttributes(addColSpan(mergedCell.attrs, mergedCell.attrs.colspan, rect.right - rect.left - mergedCell.attrs.colspan), AttributeType.RowSpan, rect.bottom - rect.top));

    if(content.size) {
      let end = mergedPos + 1 + mergedCell.content.size;
      let start = isEmpty(mergedCell) ? mergedPos + 1 : end;
      tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content);
    } /* else -- no need to replace mergedCell's content */


    tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart)));
    dispatch(tr);
  }
  return true;
};

/**
 * split a selected Cell whose rowSpan or colSpan is greater than one
 * into smaller Cells. Use the first CellType for the new Cells
 */
export const splitCell = (state: EditorState, dispatch: DispatchType) => {
  const nodeTypes = getTableNodeTypes(state.schema);
  return splitCellWithType(({ node }) => {
    return nodeTypes[node.type.spec.tableRole];
  })(state, dispatch);
};

/**
 * split a selected Cell whose rowSpan or colSpan is greater than one
 * into smaller Cell with the Cell type (th, td) returned by the
 * given getCellType function
 */
type GetCellTypeFunctionType = ({ row, col, node }: { row: number; col: number; node: ProseMirrorNode; }) => NodeType;
export const splitCellWithType = (getCellTypeFunction: GetCellTypeFunctionType) => (state: EditorState, dispatch: DispatchType) => {
  const { selection } = state;
  let cellNode, cellPos;

  if(!isCellSelection(selection)) {
    cellNode = cellWrapping(selection.$from);
    if(!cellNode) return false/*nothing to do*/;

    cellPos = cellAround(selection.$from)?.pos;

  } else {
    if(selection.$anchorCell.pos !== selection.$headCell.pos) return false/*nothing to do*/;

    cellNode = selection.$anchorCell.nodeAfter;
    cellPos = selection.$anchorCell.pos;
  }

  if(!cellNode) return false/*no Cell available*/;
  if(cellNode.attrs[AttributeType.ColSpan] === 1 && cellNode.attrs[AttributeType.RowSpan] === 1) {
    return false;
  } /* else -- colSpan or rowSpan is greater than 1 */


  if(dispatch) {
    let baseAttrs = cellNode.attrs;
    const attrs = [];
    const colwidth = baseAttrs[AttributeType.ColWidth];

    if(baseAttrs[AttributeType.RowSpan] > 1) {
      baseAttrs = setTableNodeAttributes(baseAttrs, AttributeType.RowSpan, 1);
    } /* else -- no need to change rowSpan */

    if(baseAttrs[AttributeType.ColSpan] > 1) {
      baseAttrs = setTableNodeAttributes(baseAttrs, AttributeType.ColSpan, 1);
    } /* else -- no need to change colSpan */

    const rect = selectedRect(state);
    if(!rect || !rect.table || !rect.tableMap || !rect.tableStart) return false/*no selected Rectangle in Table*/;

    for(let i = 0; i < rect.right - rect.left; i++) {
      attrs.push(colwidth ? setTableNodeAttributes(baseAttrs, AttributeType.ColWidth, colwidth && colwidth[i] ? [colwidth[i]] : null): baseAttrs);
    }

    const { tr } = state;
    let lastCell;
    for(let row = rect.top; row < rect.bottom; row++) {
      let pos = rect.tableMap.positionAt(row, rect.left, rect.table);
      if(row === rect.top) {
        pos += cellNode.nodeSize;
      } /* else -- no need to change row */

      for(let col = rect.left, i = 0; col < rect.right; col++, i++) {
        if(col === rect.left && row === rect.top) continue/* no need to insert content*/;

        const cellType = getCellTypeFunction({ node: cellNode, row, col });
        if(!cellType) continue/*no CellType available*/;

        const newCell = cellType.createAndFill(attrs[i]);
        if(!newCell) continue/*could not create new Cell*/;

        tr.insert((lastCell = tr.mapping.map(pos + rect.tableStart, 1)), newCell);
      }
    }

    if(!cellPos) return false/*no position to change Cell*/;
    tr.setNodeMarkup(cellPos, getCellTypeFunction({ node: cellNode, row: rect.top, col: rect.left }), attrs[0]);

    if( lastCell && isCellSelection(selection)) {
      const $lastCellPos = tr.doc.resolve(lastCell);
      tr.setSelection(new CellSelection(tr.doc.resolve(selection.$anchorCell.pos), $lastCellPos));
    } /* else -- no need to set CellSelection */

    dispatch(tr);
  }
  return true/*handled*/;
};

/**
 * sets the given attribute to the given value, and is only available
 * when the currently selected Cell does not already have that attribute
 * set to that value
 */
export const setCellAttr = (name: string, value: any) => (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  const $cell = selectionCell(state);
  if(!$cell) return false/*no resolved CellPos available*/;
  if($cell.nodeAfter?.attrs[name] === value) return false/*attribute already has this value*/;

  if(dispatch) {
    const { selection, tr } = state;
    if(isCellSelection(selection)) {
      selection.forEachCell((node, pos) => {
        if(!node) return/*nothing to do*/;

        if(node.attrs[name] !== value) {
          tr.setNodeMarkup(pos, null/*maintain type*/, setTableNodeAttributes(node.attrs, name, value));
        } /* else -- already has this value, do not change */
      });
    } else {
      tr.setNodeMarkup($cell.pos, null/*maintain type*/, setTableNodeAttributes($cell.nodeAfter?.attrs ?? {/*no attrs*/}, name, value));
    }

    dispatch(tr);
  }

  return true;
};

const findNextCell = ($cell: ResolvedPos, dir: 'previous' | 'next') => {
  if(dir === 'previous') {
    const { nodeBefore } = $cell;
    if(nodeBefore) {
      return $cell.pos - nodeBefore.nodeSize;
    } /* else -- no nodeBefore */

    for(let row = $cell.index(-1) - 1, rowEnd = $cell.before(); row >= 0; row--) {
      const rowNode = $cell.node(-1).child(row);
      if(rowNode.childCount && rowNode.lastChild) {
        return rowEnd - 1 - rowNode.lastChild.nodeSize;
      } /* else -- rowNode has no children or no lastChild */

      rowEnd -= rowNode.nodeSize;
    }

  } else {
    if($cell.index() < $cell.parent.childCount - 1 && $cell.nodeAfter) {
      return $cell.pos + $cell.nodeAfter.nodeSize;
    } /* else -- $cell index is less than the childCount of $cell's parent, or $cell has no nodeAfter */

    const table = $cell.node(-1);
    for(let row = $cell.indexAfter(-1), rowStart = $cell.after(); row < table.childCount; row++) {
      const rowNode = table.child(row);
      if(rowNode.childCount) {
        return rowStart + 1;
      } /* else -- rowNode has no children */

      rowStart += rowNode.nodeSize;
    }
  }

  return/*undefined*/;
};

/** select the previous or the next Cell in a Table */
export const goToCell = (direction:  'previous' | 'next') => (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  const $cell = selectionCell(state);
  if(!$cell) return false/*nothing to do*/;

  const cell = findNextCell($cell, direction);
  if(!cell) return false/*nothing to do*/;

  if(dispatch) {
    const $cell = state.doc.resolve(cell);
    const $movedForwardCell = moveCellForward($cell);
    if(!$movedForwardCell) return false/*nothing to do*/;

    const { tr } = state;
    tr.setSelection(TextSelection.between($cell, $movedForwardCell)).scrollIntoView();

    dispatch(tr);
  }

  return true;
};

// == Header ======================================================================
const isHeaderEnabledByType = (type: 'column' | 'row', rect: TableRect, types: { [nodeName: string]: NodeType; }) => {
  if(!rect.table || !rect.tableMap) return false/*no tablemap available*/;

  // Get cell positions for first row or first column
  const cellPositions = rect.tableMap.cellsInRect({
    left: 0,
    top: 0,
    right: type === 'row' ? rect.tableMap.width : 1,
    bottom: type === 'column' ? rect.tableMap.height : 1,
    table: undefined,
    tableMap: undefined,
    tableStart: undefined,
  });

  for(let i = 0; i < cellPositions.length; i++) {
    const cell = rect.table.nodeAt(cellPositions[i]);

    if(cell && cell.type !== types[NodeName.HEADER_CELL]) {
      return false;
    } /* else -- cell does not exist or is not a Header Cell */
  }

  return true/*default*/;
};

// :: (string, ?{ useDeprecatedLogic: bool }) → (EditorState, dispatch: ?(tr: Transaction)) → bool
/** toggles between row/column Header and normal Cells (only applies to first row/column) */
export const toggleHeader = (type: 'column' | 'row' | 'cell') => (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  if(dispatch) {
    const types = getTableNodeTypes(state.schema);

    const rect = selectedRect(state);
    if(!rect || !rect.tableMap) return false/*no selected Rectangle in Table*/;

    const { tr } = state;

    const isHeaderRowEnabled = isHeaderEnabledByType('row', rect, types);
    const isHeaderColumnEnabled = isHeaderEnabledByType('column', rect, types);

    let isHeaderEnabled = false/*default*/;
    if(type === 'column') { isHeaderEnabled = isHeaderRowEnabled; }
    else { isHeaderEnabled = isHeaderColumnEnabled; }

    const selectionStartsAt = isHeaderEnabled ? 1 : 0;

    let cellsRect = rect/*default*/;
    if(type === 'column') { cellsRect = new TableRect(0, selectionStartsAt, 1, rect.tableMap.height); }
    else if(type ==='row') { cellsRect = new TableRect(selectionStartsAt, 0, rect.tableMap.width, 1); }
    /* else -- do not change default */

    let newType = types[NodeName.CELL]/*default*/;
    if(type === 'column') {
      if(isHeaderColumnEnabled) { newType = types[NodeName.CELL]; }
      else { newType = types[NodeName.HEADER_CELL]; }

    } else if(type === 'row') {
      if(isHeaderRowEnabled) { newType = types[NodeName.CELL]; }
      else { newType = types[NodeName.HEADER_CELL]; }
    } /* else -- do not change default */

    rect.tableMap.cellsInRect(cellsRect).forEach((relativeCellPos) => {
      const cellPos = relativeCellPos + (rect.tableStart ?? 0/*no tableStart*/);
      const cell = tr.doc.nodeAt(cellPos);

      if(cell) {
        tr.setNodeMarkup(cellPos, newType, cell.attrs);
      } /* else -- no Cell exists at cellPos */
    });

    dispatch(tr);
  }

  return true;
};

/** toggles whether the selected Row contains HeaderCells */
export const toggleHeaderRow = toggleHeader('row');

/** toggles whether the selected Column contains header Cells */
export const toggleHeaderColumn = toggleHeader('column');

/** toggles whether the selected Cells are HeaderCells */
export const toggleHeaderCell = toggleHeader('cell');

// == Selection ===================================================================
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


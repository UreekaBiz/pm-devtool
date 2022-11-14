import { Fragment, Node as ProseMirrorNode, NodeType, ResolvedPos } from 'prosemirror-model';
import { Command, EditorState, TextSelection, Transaction } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { isCellSelection } from '../../../../notebookEditor/selection';
import { isNotNullOrUndefined } from '../../../../util/object';
import { CellSelection, TableMap, TableRect } from '../../../extension/table/class';
import { getTableNodeTypes } from '../../../extension/table/node/table';
import { addColSpan, cellAround, cellWrapping, isInTable, moveCellForward, selectedRect, selectionCell, setTableNodeAttributes } from '../../..//extension/table/util';
import { AbstractDocumentUpdate, DispatchType } from '../../type';

// ********************************************************************************
/**
 * merge the selected Cells into a single Cell, only available
 * when the selected Cell's outline forms a Rectangle
 */
export const mergeCellsCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new MergeCellsDocumentUpdate().update(state, state.tr), dispatch);
export class MergeCellsDocumentUpdate implements AbstractDocumentUpdate {
  constructor() {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;
    if(!isCellSelection(selection) || selection.$anchorCell.pos === selection.$headCell.pos) {
      return false;
    } /* else -- can try to merge Cells */

    const rect = selectedRect(editorState);
    if(!rect) return false/*no TableRect available*/;

    const { table, tableMap, tableStart } = rect;
    if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return false/*nothing to do*/;
    if(cellsOverlapRectangle(tableMap.map, tableMap.width, tableMap.height, rect)) return false/*nothing to do*/;

    const seen: { [key: number]: boolean; } = {};
    let content = Fragment.empty;
    let mergedPos, mergedCell;

    for(let row = rect.top; row < rect.bottom; row++) {
      for(let col = rect.left; col < rect.right; col++) {
        const cellPos = tableMap.map[row * tableMap.width + col];
        const cell = table.nodeAt(cellPos);

        if(!cell) continue/*nothing to do*/;
        if(seen[cellPos]) continue/*already seen*/;

        seen[cellPos] = true;
        if(mergedPos === null) {
          mergedPos = cellPos;
          mergedCell = cell;
        } else {
          if(!isCellEmpty(cell)) content = content.append(cell.content);
          let mapped = tr.mapping.map(cellPos + tableStart);
          tr.delete(mapped, mapped + cell.nodeSize);
        }
      }
    }

    if(!mergedPos || !mergedCell) return false/*could not merge Cells*/;
    tr.setNodeMarkup(mergedPos + tableStart, null, setTableNodeAttributes(addColSpan(mergedCell.attrs, mergedCell.attrs[AttributeType.ColSpan], rect.right - rect.left - mergedCell.attrs[AttributeType.ColSpan]), AttributeType.RowSpan, rect.bottom - rect.top));

    if(content.size) {
      let end = mergedPos + 1 + mergedCell.content.size;
      let start = isCellEmpty(mergedCell) ? mergedPos + 1 : end;
      tr.replaceWith(start + tableStart, end + tableStart, content);
    } /* else -- no need to replace mergedCell's content */


    tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos + tableStart)));
    return tr;
  }
}

/**
 * split a selected Cell whose rowSpan or colSpan is greater than one
 * into smaller Cells. Use the first CellType for the new Cells
 */
export const splitCellCommand = (state: EditorState, dispatch: DispatchType) => {
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
const splitCellWithType = (getCellTypeFunction: GetCellTypeFunctionType) => (state: EditorState, dispatch: DispatchType) => {
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
    const colWidth = baseAttrs[AttributeType.ColWidth];

    if(baseAttrs[AttributeType.RowSpan] > 1) {
      baseAttrs = setTableNodeAttributes(baseAttrs, AttributeType.RowSpan, 1);
    } /* else -- no need to change rowSpan */

    if(baseAttrs[AttributeType.ColSpan] > 1) {
      baseAttrs = setTableNodeAttributes(baseAttrs, AttributeType.ColSpan, 1);
    } /* else -- no need to change colSpan */

    const rect = selectedRect(state);
    if(!rect || !rect.table || !rect.tableMap || !rect.tableStart) return false/*no selected Rectangle in Table*/;

    for(let i = 0; i < rect.right - rect.left; i++) {
      attrs.push(colWidth ? setTableNodeAttributes(baseAttrs, AttributeType.ColWidth, colWidth && colWidth[i] ? [colWidth[i]] : null) : baseAttrs);
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

    if(lastCell && isCellSelection(selection)) {
      const $lastCellPos = tr.doc.resolve(lastCell);
      tr.setSelection(new CellSelection(tr.doc.resolve(selection.$anchorCell.pos), $lastCellPos));
    } /* else -- no need to set CellSelection */

    dispatch(tr);
  }
  return true/*handled*/;
};

/** select the previous or the next Cell in a Table */
export const goToCellCommand = (direction: 'previous' | 'next') => (state: EditorState, dispatch: DispatchType) => {
  if(!isInTable(state)) return false/*nothing to do*/;

  const $cell = selectionCell(state);
  if(!$cell) return false/*nothing to do*/;

  const cell = findCell($cell, direction);
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

// == Util ========================================================================
const isCellEmpty = (cell: ProseMirrorNode) => {
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

const findCell = ($cell: ResolvedPos, dir: 'previous' | 'next') => {
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

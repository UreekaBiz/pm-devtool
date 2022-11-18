import { Fragment, Node as ProseMirrorNode, NodeType, ResolvedPos } from 'prosemirror-model';
import { Command, EditorState, TextSelection, Transaction } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { isCellSelection } from '../../../../notebookEditor/selection';
import { isNotNullOrUndefined } from '../../../../util/object';
import { CellSelection, TableMap, TableRect } from '../../../extension/table/class';
import { getTableNodeTypes } from '../../../extension/table/node/table';
import { addColumnSpans, getResolvedCellPosAroundResolvedPos, getCellWrapperAtResolvedPos, isSelectionHeadInRow, moveResolvedCellPosForward, getSelectedTableRect, getResolvedCellPos, updateTableNodeAttributes } from '../../..//extension/table/util';
import { AbstractDocumentUpdate } from '../../type';

// ********************************************************************************
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/commands.js

/**
 * merge the selected Cells into a single Cell, if
 * its outline forms a Rectangle
 */
export const mergeCellsCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new MergeCellsDocumentUpdate().update(state, state.tr), dispatch);
export class MergeCellsDocumentUpdate implements AbstractDocumentUpdate {
  constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that the selected Cells are
   * merged into a single Cell, if its outline forms a Rectangle
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;
    if(!isCellSelection(selection) || selection.$anchorCell.pos == selection.$headCell.pos) return false/*nothing to do*/;

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*nothing to do*/;

    const { table, tableMap, tableStart } = tableRect;
    if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return false/*nothing to do*/;
    if(areCellsOverlappingTableRect(tableMap.map, tableMap.width, tableMap.height, tableRect)) return false/*nothing to do*/;

    const seenCellPositions: { [key: number]: boolean; } = {/*default empty*/};
    let mergedCellContent = Fragment.empty/*default*/;
    let mergedPos: number | undefined = undefined/*default*/;
    let mergedCell: ProseMirrorNode | undefined = undefined/*default*/;

    for(let row = tableRect.top; row < tableRect.bottom; row++) {
      for(let column = tableRect.left; column < tableRect.right; column++) {
        const cellPos = tableMap.map[row * tableMap.width + column],
              cellNode = table.nodeAt(cellPos);
        if(!cellNode || seenCellPositions[cellPos]) continue/*already seen*/;

        seenCellPositions[cellPos] = true/*by definition*/;
        if(mergedPos === undefined) {
          mergedPos = cellPos;
          mergedCell = cellNode;
        } else {
          if(!isCellEmpty(cellNode)) {
            mergedCellContent = mergedCellContent.append(cellNode.content);
          } /* else -- cell is not empty */

          const mappedCellPos = tr.mapping.map(cellPos + tableStart);
          tr.delete(mappedCellPos, mappedCellPos + cellNode.nodeSize);
        }
      }
    }

    if(!isNotNullOrUndefined<number>(mergedPos) || !mergedCell) return false/*nothing to do*/;

    tr.setNodeMarkup(mergedPos + tableStart, null/*maintain type*/, updateTableNodeAttributes(addColumnSpans(mergedCell.attrs, mergedCell.attrs[AttributeType.ColSpan], tableRect.right - tableRect.left - mergedCell.attrs[AttributeType.ColSpan]), AttributeType.RowSpan, tableRect.bottom - tableRect.top));
    if(mergedCellContent.size) {
      let mergedCellContentEnd = mergedPos + 1 + mergedCell.content.size,
          mergedCellContentStart = isCellEmpty(mergedCell) ? mergedPos + 1 : mergedCellContentEnd;
      tr.replaceWith(mergedCellContentStart + tableStart, mergedCellContentEnd + tableStart, mergedCellContent);
    } /* else -- no content */

    tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos + tableStart)));
    return tr;
  }
}

/**
 * type of the function that returns the type of the Cell to be created
 * whenever a Cell whose rowSpan or colSpan is greater than one is split
 */
export type GetCellTypeFunctionType = (state: EditorState, row: number, col: number, node: ProseMirrorNode) => NodeType;
const defaultGetCellTypeFunction: GetCellTypeFunctionType = (state, row, col, node) => {
  const nodeTypes = getTableNodeTypes(state.schema);
  return nodeTypes[node.type.name];
};

/**
 * split the selected Cell if its rowSpan or colSPan is greater than one
 * into smaller Cells, using the type returned by the getCellTypeFunction
 */
export const splitCellCommand = (getCellTypeFunction?: GetCellTypeFunctionType): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SplitCellDocumentUpdate(getCellTypeFunction).update(state, state.tr), dispatch);

export class SplitCellDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly getCellTypeFunction: GetCellTypeFunctionType = defaultGetCellTypeFunction) {/*nothing additional*/ }

  /**
   * modify the given Transaction such that the selected Cell is split such
   * that the selected Cells are split into smaller Cells
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;
    let cellPos: number | undefined = undefined/*default*/,
        cellNode: ProseMirrorNode | null = null/*default*/;

    if(!isCellSelection(selection)) {
      cellNode = getCellWrapperAtResolvedPos(selection.$from);
      if(!cellNode) return false/*nothing to do*/;

      cellPos = getResolvedCellPosAroundResolvedPos(selection.$from)?.pos;

    } else {
      if(selection.$anchorCell.pos !== selection.$headCell.pos) return false/*nothing to do*/;
      cellNode = selection.$anchorCell.nodeAfter;
      cellPos = selection.$anchorCell.pos;
    }

    if(!cellNode) return false/*no Cell available*/;
    if(cellNode.attrs[AttributeType.ColSpan] === 1 && cellNode.attrs[AttributeType.RowSpan] === 1) return false/*Cell is not merged*/;

    let baseAttrs = cellNode.attrs;
    const cellsAttrsArray = [/*default empty*/];
    const colWidth = baseAttrs[AttributeType.ColWidth];

    if(baseAttrs[AttributeType.RowSpan] > 1) {
      baseAttrs = updateTableNodeAttributes(baseAttrs, AttributeType.RowSpan, 1);
    } /* else -- no need to change rowSpan */

    if(baseAttrs[AttributeType.ColSpan] > 1) {
      baseAttrs = updateTableNodeAttributes(baseAttrs, AttributeType.ColSpan, 1);
    } /* else -- no need to change colSpan */

    const tableRect = getSelectedTableRect(editorState);
    if(!tableRect) return false/*no selected Rectangle in Table*/;

    const { table, tableMap, tableStart } = tableRect;
    if(!isNotNullOrUndefined<ProseMirrorNode>(table) || !isNotNullOrUndefined<TableMap>(tableMap) || !isNotNullOrUndefined<number>(tableStart)) return false/*nothing to do*/;

    for(let i = 0; i < tableRect.right - tableRect.left; i++) {
      cellsAttrsArray.push(colWidth ? updateTableNodeAttributes(baseAttrs, AttributeType.ColWidth, colWidth && colWidth[i] ? [colWidth[i]] : null/*no columnWidth specified*/) : baseAttrs);
    }

    let lastCellPos: number | undefined = undefined;
    for(let row = tableRect.top; row < tableRect.bottom; row++) {
      let cellPos = tableMap.cellPositionAt(row, tableRect.left, table);
      if(row === tableRect.top) {
        cellPos += cellNode.nodeSize;
      } /* else -- no need to change row */

      for(let column = tableRect.left, i = 0; column < tableRect.right; column++, i++) {
        if(column === tableRect.left && row === tableRect.top) continue/* no need to insert content*/;

        const cellType = this.getCellTypeFunction(editorState, row, column, cellNode);
        if(!cellType) continue/*no CellType available*/;

        const newCell = cellType.createAndFill(cellsAttrsArray[i]);
        if(!newCell) continue/*could not create new Cell*/;

        tr.insert((lastCellPos = tr.mapping.map(cellPos + tableStart, 1/*associate to the right*/)), newCell);
      }
    }

    if(!isNotNullOrUndefined<number>(cellPos)) return false/*no position to change Cell*/;
    tr.setNodeMarkup(cellPos, this.getCellTypeFunction(editorState, tableRect.top, tableRect.left, cellNode), cellsAttrsArray[0/*first attrs object*/]);

    if(lastCellPos && isCellSelection(selection)) {
      const $lastCellPos = tr.doc.resolve(lastCellPos);
      tr.setSelection(new CellSelection(tr.doc.resolve(selection.$anchorCell.pos), $lastCellPos));
    } /* else -- no need to set CellSelection */

    return tr/*handled*/;
  }
}

/** select the previous or the next Cell in a Table */
export const goToCellCommand = (direction: 'previous' | 'next'): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new GoToCellDocumentUpdate(direction).update(state, state.tr), dispatch);
export class GoToCellDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly direction: 'previous' | 'next') {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction) {
    if(!isSelectionHeadInRow(editorState)) return false/*nothing to do*/;

    let resolvedCellPos = getResolvedCellPos(editorState);
    if(!resolvedCellPos) return false/*nothing to do*/;

    const cellPos = findCellAtDirection(resolvedCellPos, this.direction);
    if(!cellPos) return false/*nothing to do*/;

    resolvedCellPos = editorState.doc.resolve(cellPos);
    const $movedForwardCell = moveResolvedCellPosForward(resolvedCellPos);
    if(!$movedForwardCell) return false/*could not move cell forward*/;

    tr.setSelection(TextSelection.between(resolvedCellPos, $movedForwardCell)).scrollIntoView();
    return tr/*updated*/;
  }
}
// == Util ========================================================================
/* check if the given CellNode is empty */
const isCellEmpty = (cell: ProseMirrorNode) => {
  const { content: cellContent } = cell;

  return (cellContent.childCount === 1/*Cell has only a single child*/
    && cellContent.firstChild
    && cellContent.firstChild.isTextblock
    && cellContent.firstChild.childCount === 0/*textBlock has no children*/
  );
};

/* check if the Cells of a TableMap overlap their TableRect */
const areCellsOverlappingTableRect = (tableMap: number[], width: number, height: number, tableRect: TableRect) => {
  let indexTop = tableRect.top * width + tableRect.left,
      indexLeft = indexTop;

  let indexBottom = (tableRect.bottom - 1) * width + tableRect.left,
      indexRight = indexTop + (tableRect.right - tableRect.left - 1);

  for(let i = tableRect.top; i < tableRect.bottom; i++) {
    if((tableRect.left > 0 && tableMap[indexLeft] === tableMap[indexLeft - 1]) || (tableRect.right < width && tableMap[indexRight] === tableMap[indexRight + 1])) {
      return true/*overlap*/;
    } /* else -- keep looking */
    indexLeft += width;
    indexRight += width;
  }

  for(let i = tableRect.left; i < tableRect.right; i++) {
    if((tableRect.top > 0 && tableMap[indexTop] === tableMap[indexTop - width]) || (tableRect.bottom < height && tableMap[indexBottom] === tableMap[indexBottom + width])) {
      return true/*overlap*/;
    } /* else -- keep looking */

    indexTop++;
    indexBottom++;
  }


  return false/*default*/;
};

const findCellAtDirection = ($cell: ResolvedPos, direction: 'previous' | 'next') => {
  if(direction === 'previous') {
    const { nodeBefore } = $cell;
    if(nodeBefore) {
      return $cell.pos - nodeBefore.nodeSize;
    } /* else -- no nodeBefore */

    for(let row = $cell.index(-1/*grandParent*/) - 1, rowEnd = $cell.before(); row >= 0; row--) {
      const rowNode = $cell.node(-1/*grandParent*/).child(row);
      if(rowNode.childCount && rowNode.lastChild) {
        return rowEnd - 1 - rowNode.lastChild.nodeSize;
      } /* else -- rowNode has no children or no lastChild */

      rowEnd -= rowNode.nodeSize;
    }

  } else {
    if($cell.index() < $cell.parent.childCount - 1 && $cell.nodeAfter) {
      return $cell.pos + $cell.nodeAfter.nodeSize;
    } /* else -- $cell index is less than the childCount of $cell's parent, or $cell has no nodeAfter */

    const tableNode = $cell.node(-1/*grandParent*/);
    for(let row = $cell.indexAfter(-1/*grandParent depth*/), rowStart = $cell.after(); row < tableNode.childCount; row++) {
      const rowNode = tableNode.child(row);
      if(rowNode.childCount) {
        return rowStart + 1;
      } /* else -- rowNode has no children */

      rowStart += rowNode.nodeSize;
    }
  }

  return/*undefined*/;
};

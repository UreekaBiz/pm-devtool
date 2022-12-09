
import { Fragment, Node as ProseMirrorNode, ResolvedPos, Slice } from 'prosemirror-model';
import { Selection, TextSelection, SelectionRange, Transaction, EditorState } from 'prosemirror-state';
import { Mappable, Mapping } from 'prosemirror-transform';
import { Decoration, DecorationSet } from 'prosemirror-view';


import { AttributeType } from '../../../attribute';
import { isCellNode, isHeaderCellNode, isRowNode, isTableNode } from '../node';
import { isNodeSelection, isTextSelection } from '../../../selection';
import { isTableTypeNode } from '../type';
import { areResolvedPositionsInTable, isResolvedPosPointingAtCell, updateTableNodeAttributes, removeColumnSpans } from '../util';
import { TableMap } from './TableMap';

// ********************************************************************************
// == Constant ====================================================================
const SELECTED_CELL_CLASS = 'selectedCell'/*(SEE: table.css)*/;

// == Interface ===================================================================
// re defined since it is not exported from prosemirror-state
interface SelectionBookmark {
  /** map the bookmark through a set of changes */
  map: (mapping: Mappable) => SelectionBookmark;

  /** resolve the bookmark to a real Selection again*/
  resolve: (doc: ProseMirrorNode) => Selection;
}

// == Type ========================================================================
type JSONCellSelection = {
  type: 'cell';
  anchor: number;
  head: number;
}

// == Selection Class =============================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/cellselection.js
/**
  * A {@link Selection} subclass that represents a {@link CellSelection}
  * spanning part of a table. With the plugin enabled, these will be
  * created when the user selects across cells, and will be drawn
  * by giving selected cells a `selectedCell` CSS class.
  */
export class CellSelection extends Selection {
  // -- Attribute -----------------------------------------------------------------
  /**
   * a {@link ResolvedPos} pointing in front of the anchor cell (the one that
   * does not move when extending the {@link Selection})
   */
  public $anchorCell: ResolvedPos;

  /**
   * A {@link ResolvedPos} pointing into the front of the head cell (the one that
   * moves when extending the {@link Selection}).
   */
  public $headCell: ResolvedPos;

  // -- Lifecycle -----------------------------------------------------------------
  /**
   * a {@link CellSelection} is identified by its anchor and head cells.
   * the positions given to the constructor should point before
   * two cells in the same table. They may be the same, to select a
   * single Cell
   */
  constructor($anchorCell: ResolvedPos, $headCell: ResolvedPos = $anchorCell/*default to the same cell*/) {
    const table = $anchorCell.node(-1/*Table ancestor*/),
          tableMap = TableMap.getTableMap(table),
          startOfTable = $anchorCell.start(-1/*Table ancestor depth*/);

    const tableRect = tableMap.getTableRectBetweenCellPositions($anchorCell.pos - startOfTable, $headCell.pos - startOfTable);
    const doc = $anchorCell.node(0);
    const selectedCells = tableMap.getCellsInTableRect(tableRect).filter((pos: number) => pos !== $headCell.pos - startOfTable);

    // make the head Cell the first range so that it counts
    // as the primary part of the Selection
    selectedCells.unshift($headCell.pos - startOfTable);

    const selectedRanges = selectedCells.filter(pos => table.nodeAt(pos)).map((pos: number) => {
    const selectedCell = table.nodeAt(pos);
    const from = pos + startOfTable + 1;

      return new SelectionRange(doc.resolve(from), doc.resolve(from + selectedCell/*guaranteed by filter*/!.content.size));
    });

    super(selectedRanges[0/*head Cell*/].$from, selectedRanges[0/*head Cell*/].$to, selectedRanges);
    this.$anchorCell = $anchorCell;
    this.$headCell = $headCell;
    this.visible = false/*prevent the SelectedRange to be visible to the User in the browser*/;
  }

  // -- Method --------------------------------------------------------------------
  /** map a {@link CellSelection} through a {@link Mapping} */
  public map(doc: ProseMirrorNode, mapping: Mapping): Selection {
    const $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos));
    const $headCell = doc.resolve(mapping.map(this.$headCell.pos));

    if(isResolvedPosPointingAtCell($anchorCell)
      && isResolvedPosPointingAtCell($headCell)
      && areResolvedPositionsInTable($anchorCell, $headCell)
    ) {
      const tableChanged = this.$anchorCell.node(-1/*grandParent*/) !== $anchorCell.node(-1/*grandParent*/);

      if(tableChanged && this.isRowSelection()) { return CellSelection.createRowSelection($anchorCell, $headCell); }
      else if(tableChanged && this.isColSelection()) { return CellSelection.createColumnSelection($anchorCell, $headCell); }
      else { return new CellSelection($anchorCell, $headCell); }
    }
    return TextSelection.between($anchorCell, $headCell);
  }

  /** returns a rectangular {@link Slice} of table rows containing the selected cells */
  public content() {
    const selectedTable = this.$anchorCell.node(-1/*grandParent*/),
          tableMap = TableMap.getTableMap(selectedTable),
          tableStart = this.$anchorCell.start(-1/*grandParent depth*/);

    const tableRect = tableMap.getTableRectBetweenCellPositions(this.$anchorCell.pos - tableStart, this.$headCell.pos - tableStart);
    const seenCellPositions: { [key: number]: boolean; } = {};
    const selectedRows = [/*default empty*/];

    for(let row = tableRect.top; row < tableRect.bottom; row++) {
      const rowContent: ProseMirrorNode[] = [/*default emtpty*/];

      for(let index = row * tableMap.width + tableRect.left, col = tableRect.left; col < tableRect.right; col++, index++) {
        const cellPos = tableMap.map[index];

        if(!seenCellPositions[cellPos]) {
          seenCellPositions[cellPos] = true;
          const cellRect = tableMap.getCellTableRect(cellPos);
          let cell = selectedTable.nodeAt(cellPos);

          if(cell) {
            const extraLeft = tableRect.left - cellRect.left,
                  extraRight = cellRect.right - tableRect.right;

            if(extraLeft > 0 || extraRight > 0) {
              let { attrs: cellAttrs } = cell;
              if(extraLeft > 0) {
                cellAttrs = removeColumnSpans(cellAttrs, 0/*start*/, extraLeft);
              } /* else -- no need to account for extra spanning to the left */

              if(extraRight > 0) {
                cellAttrs = removeColumnSpans(cellAttrs, cellAttrs[AttributeType.ColSpan] - extraRight, extraRight);
              } /* else -- no need to account for extra spanning to the right  */

              if(cellRect.left < tableRect.left) {
                cell = cell.type.createAndFill(cellAttrs);
              } else {
                cell = cell.type.create(cellAttrs, cell.content);
              }
            } /* else -- neither extraLeft nor extraRight are bigger than 0*/

            if(cellRect.top < tableRect.top || cellRect.bottom > tableRect.bottom) {
              const cellAttrs = cell && updateTableNodeAttributes(cell.attrs, AttributeType.RowSpan, Math.min(cellRect.bottom, tableRect.bottom) - Math.max(cellRect.top, tableRect.top));

              if(cell && cellRect.top < tableRect.top) { cell = cell.type.createAndFill(cellAttrs); }
              else { cell = cell && cell.type.create(cellAttrs, cell.content); }
            } /* else -- neither the cell rect top is smaller than the rect's top, nor the cell rect bottom is bigger than the rect bottom  */

            if(cell) {
              rowContent.push(cell);
            } /* else -- cell does not exist, nothing to add to the rowContent */

          } /* else -- there is no node at the cell pos*/
        } /* else -- already seen the cell at this position */
      }

      selectedRows.push(selectedTable.child(row).copy(Fragment.from(rowContent)));
    }

    const selectedFragment = this.isColSelection() && this.isRowSelection() ? selectedTable : selectedRows;
    return new Slice(Fragment.from(selectedFragment), 1/*Slice is open by 1 at start*/, 1/*Slice is open by 1 at end*/);
  }

  /** (SEE: {@link Selection} replace) */
  public replace(tr: Transaction, content = Slice.empty) {
    const mapFrom = tr.steps.length;
    const selectedRanges = this.ranges;

    for(let i = 0; i < selectedRanges.length; i++) {
      const { $from, $to } = selectedRanges[i];
      const mapping = tr.mapping.slice(mapFrom);
      tr.replace(mapping.map($from.pos), mapping.map($to.pos), i ? Slice.empty : content);
    }

    const selection = Selection.findFrom(tr.doc.resolve(tr.mapping.slice(mapFrom).map(this.to)), -1/*look back*/);
    if(selection) {
      tr.setSelection(selection);
    } /* else -- no valid Selection found*/
  }

  /** (SEE: {@link Selection} replaceWith) */
  public replaceWith(tr: Transaction, node: ProseMirrorNode) {
    this.replace(tr, new Slice(Fragment.from(node), 0/*use full Slice*/, 0/*use full Slice*/));
  }

  /** execute the given callback for each cell in the {@link CellSelection} */
  public forEachCell(callback: (node: ProseMirrorNode | null, pos: number) => void) {
    const table = this.$anchorCell.node(-1/*grandParent*/),
          tableMap = TableMap.getTableMap(table),
          tableStart = this.$anchorCell.start(-1/*grandParent depth*/);

    const selectedCells = tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(this.$anchorCell.pos - tableStart, this.$headCell.pos - tableStart));
    for(let i = 0; i < selectedCells.length; i++) {
      callback(table.nodeAt(selectedCells[i]), tableStart + selectedCells[i]);
    }
  }

  /**
   * return true if the {@link CellSelection} goes all the way from the
   * top to the bottom of the Table
   */
  public isColSelection() {
    const anchorTopIndex = this.$anchorCell.index(-1/*grandParent depth*/),
          headTopIndex = this.$headCell.index(-1/*grandParent depth*/);

    if(Math.min(anchorTopIndex, headTopIndex) > 0) return false/*by definition*/;

    const anchorBottomIndex = anchorTopIndex + this.$anchorCell.nodeAfter?.attrs[AttributeType.RowSpan],
          headBottomIndex = headTopIndex + this.$headCell.nodeAfter?.attrs[AttributeType.RowSpan];

    return Math.max(anchorBottomIndex, headBottomIndex) === this.$headCell.node(-1/*grandParent*/).childCount;
  }

  /**
   * return the smallest column {@link CellSelection} that covers the Cells at the
   * given anchor and head {@link ResolvedPos}itions
   */
  static createColumnSelection($anchorCell: ResolvedPos, $headCell = $anchorCell) {
    const tableMap = TableMap.getTableMap($anchorCell.node(-1/*grandParent*/)),
          tableStart = $anchorCell.start(-1/*grandParent depth*/);

    const anchorTableRect = tableMap.getCellTableRect($anchorCell.pos - tableStart),
          headTableRect = tableMap.getCellTableRect($headCell.pos - tableStart);

    const doc = $anchorCell.node(0/*doc depth*/);
    if(anchorTableRect.top <= headTableRect.top) {
      if(anchorTableRect.top > 0) {
        $anchorCell = doc.resolve(tableStart + tableMap.map[anchorTableRect.left]);
      } /* else -- anchor rect's top is not bigger than 0 */

      if(headTableRect.bottom < tableMap.height) {
        $headCell = doc.resolve(tableStart + tableMap.map[tableMap.width * (tableMap.height - 1) + headTableRect.right - 1]);
      } /* else -- head rect's bottom is not smaller than the height of the map*/

    } else {
      if(headTableRect.top > 0) {
        $headCell = doc.resolve(tableStart + tableMap.map[headTableRect.left]);
      } /* else -- anchor rect's top is not bigger than 0 */

      if(anchorTableRect.bottom < tableMap.height) {
        $anchorCell = doc.resolve(tableStart + tableMap.map[tableMap.width * (tableMap.height - 1) + anchorTableRect.right - 1]);
      } /* else -- head rect's bottom is not smaller than the height of the map*/
    }

    return new CellSelection($anchorCell, $headCell);
  }

  /**
   * return true if the {@link CellSelection} goes all the way from the left to
   * the right of the Table
   */
  public isRowSelection() {
    const tableMap = TableMap.getTableMap(this.$anchorCell.node(-1/*grandParent*/)),
          tableStart = this.$anchorCell.start(-1/*grandParent depth*/);

    const anchorLeftSide = tableMap.getColumnAmountBeforePos(this.$anchorCell.pos - tableStart),
          headLeftSide = tableMap.getColumnAmountBeforePos(this.$headCell.pos - tableStart);
    if(Math.min(anchorLeftSide, headLeftSide) > 0) return false/*by definition*/;

    const anchorRightSide = anchorLeftSide + this.$anchorCell.nodeAfter?.attrs[AttributeType.ColSpan],
        headRightSide = headLeftSide + this.$headCell.nodeAfter?.attrs[AttributeType.ColSpan];

    return Math.max(anchorRightSide, headRightSide) == tableMap.width;
  }

  /** (SEE: {@link Selection} eq) */
  public eq(other: Selection) {
    return (other instanceof CellSelection && other.$anchorCell.pos == this.$anchorCell.pos && other.$headCell.pos == this.$headCell.pos);
  }

  /**
   * return the smallest row {@link CellSelection} that covers the Cells at the
   * given anchor and head {@link ResolvedPos}itions
   */
  public static createRowSelection($anchorCell: ResolvedPos, $headCell = $anchorCell) {
    const tableMap = TableMap.getTableMap($anchorCell.node(-1/*grandParent*/)),
          tableStart = $anchorCell.start(-1/*grandParent depth*/);

    const anchorTableRect = tableMap.getCellTableRect($anchorCell.pos - tableStart),
          headTableRect = tableMap.getCellTableRect($headCell.pos - tableStart);

    const doc = $anchorCell.node(0/*doc depth*/);
    if(anchorTableRect.left <= headTableRect.left) {
      if(anchorTableRect.left > 0) {
        $anchorCell = doc.resolve(tableStart + tableMap.map[anchorTableRect.top * tableMap.width]);
      } /* else -- anchor rect's left is not bigger than 0 */

      if(headTableRect.right < tableMap.width) {
        $headCell = doc.resolve(tableStart + tableMap.map[tableMap.width * (headTableRect.top + 1) - 1]);
      } /* else -- head rect's right is not smaller than the width of the map*/
    } else {
      if(headTableRect.left > 0) {
        $headCell = doc.resolve(tableStart + tableMap.map[headTableRect.top * tableMap.width]);
      } /* else -- anchor rect's left is not bigger than 0 */
      if(anchorTableRect.right < tableMap.width) {
        $anchorCell = doc.resolve(tableStart + tableMap.map[tableMap.width * (anchorTableRect.top + 1) - 1]);
      } /* else -- head rect's right is not smaller than the width of the map*/
    }

    return new CellSelection($anchorCell, $headCell);
  }

  /** (SEE: {@link Selection} toJSON) */
  public toJSON(): JSONCellSelection { return { type: 'cell', anchor: this.$anchorCell.pos, head: this.$headCell.pos }; }

  /** (SEE: {@link Selection} fromJSON) */
  public static fromJSON(doc: ProseMirrorNode, json: JSONCellSelection) {
    return new CellSelection(doc.resolve(json.anchor), doc.resolve(json.head));
  }

  /** create a {@link CellSelection} */
  public static create(doc: ProseMirrorNode, anchorCellPos: number, headCellPos = anchorCellPos): CellSelection {
    return new CellSelection(doc.resolve(anchorCellPos), doc.resolve(headCellPos));
  }

  /** (SEE: {@link Selection} getBookMark) */
  public getBookmark(): CellBookmark {
    return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos);
  }
}

// -- CellSelection defaults ------------------------------------------------------
// register CellSelection to be de-serializable
Selection.jsonID('cell', CellSelection);

// == BookMark Class ==============================================================
class CellBookmark implements SelectionBookmark {
  // -- Lifecycle -----------------------------------------------------------------
  constructor(public anchorPos: number, public headPos: number) {/*nothing additional*/}

  // -- Method --------------------------------------------------------------------
  /** (SEE: {@link SelectionBookmark} map) */
  public map(mapping: Mappable) {
    return new CellBookmark(mapping.map(this.anchorPos), mapping.map(this.headPos));
  }

  /** (SEE: {@link SelectionBookmark} resolve) */
  public resolve(doc: ProseMirrorNode) {
    const $anchorCell = doc.resolve(this.anchorPos),
          $headCell = doc.resolve(this.headPos);

    if(isRowNode($anchorCell.parent)
      && isRowNode($headCell.parent)
      && $anchorCell.index() < $anchorCell.parent.childCount
      && $headCell.index() < $headCell.parent.childCount
      && areResolvedPositionsInTable($anchorCell, $headCell)
    ) {
      return new CellSelection($anchorCell, $headCell);
    } else {
      return Selection.near($headCell, 1/*bias to the right*/);
    }
  }
}

// == Util ========================================================================
/** add {@link Decoration}s for the selected cells in a {@link CellSelection} */
export const drawCellSelection = (state: EditorState) => {
  if(!(state.selection instanceof CellSelection)) return null/*not a CellSelection by definition, nothing to do*/;

  const cellDecorations: Decoration[] = [/*default empty*/];
  state.selection.forEachCell((node, pos) => {
    if(node) {
      cellDecorations.push(Decoration.node(pos, pos + node.nodeSize, { class: SELECTED_CELL_CLASS }));
    } /* else -- nothing to do */
  });

  return DecorationSet.create(state.doc, cellDecorations);
};

/** check if the {@link CellSelection} has a Cell boundary */
const isCellBoundarySelection = ({ $from, $to }: { $from: ResolvedPos; $to: ResolvedPos; }) => {
  if($from.pos === $to.pos || $from.pos < $from.pos - 6) return false/*no boundary*/;

  let afterFromPos = $from.pos;
  let fromDepth = $from.depth/*default start*/;
  for(; fromDepth >= 0; fromDepth--, afterFromPos++) {
    if($from.after(fromDepth + 1) < $from.end(fromDepth)) break;
  }

  let beforeToPos = $to.pos;
  for(let toDepth = $to.depth; toDepth >= 0; toDepth--, beforeToPos--) {
    if($to.before(toDepth + 1) > $to.start(toDepth)) break;
  }

  return (afterFromPos === beforeToPos && (isTableNode($from.node(fromDepth)) || isRowNode($from.node(fromDepth))));
};

/** check if the {@link Selection} is across cells */
const isTextSelectionAcrossCells = ({ $from, $to }: { $from: ResolvedPos; $to: ResolvedPos; }) => {
  let fromCellBoundaryNode;
  let toCellBoundaryNode;

  for(let fromDepth = $from.depth; fromDepth > 0; fromDepth--) {
    let nodeAtDepth = $from.node(fromDepth);
    if(isHeaderCellNode(nodeAtDepth) || isCellNode(nodeAtDepth)) {
      fromCellBoundaryNode = nodeAtDepth;
      break;
    } /* else -- nodeAtDepth is not a Cell */
  }

  for(let toDepth = $to.depth; toDepth > 0; toDepth--) {
    let nodeAtDepth = $to.node(toDepth);
    if(isHeaderCellNode(nodeAtDepth) || isCellNode(nodeAtDepth)) {
      toCellBoundaryNode = nodeAtDepth;
      break;
    } /* else -- nodeAtDepth is not a Cell */
  }

  return (fromCellBoundaryNode !== toCellBoundaryNode && $to.parentOffset === 0);
};

export const normalizeSelection = (newState: EditorState, allowTableNodeSelection: boolean, tr?: Transaction) => {
  const selection = (tr || newState).selection;
  const doc = (tr || newState).doc;

  let normalizedSelection: Selection | undefined = undefined/*default*/;
  if(isNodeSelection(selection) && isTableTypeNode(selection.node)) {
    const { node } = selection;
    if(isHeaderCellNode(node) || isCellNode(node)) {
      normalizedSelection = CellSelection.create(doc, selection.from);

    } else if(isRowNode(node)) {
      const $cell = doc.resolve(selection.from + 1);
      normalizedSelection = CellSelection.createRowSelection($cell, $cell);

    } else if(!allowTableNodeSelection) {
      const map = TableMap.getTableMap(selection.node);
      const start = selection.from + 1;
      const lastCell = start + map.map[map.width * map.height - 1];
      normalizedSelection = CellSelection.create(doc, start + 1, lastCell);
    } /* else -- role is not Cell, HeaderCell and cannot select Table Node */

  } else if(isTextSelection(selection) && isCellBoundarySelection(selection)) {
    normalizedSelection = TextSelection.create(doc, selection.from);
  } else if(isTextSelection(selection) && isTextSelectionAcrossCells(selection)) {
    normalizedSelection = TextSelection.create(doc, selection.$from.start(), selection.$from.end());
  } /* else -- no TextSelection, not a CellBoundarySelection, or TextSelection is not across cells */


  if(normalizedSelection) {
    (tr || (tr = newState.tr)).setSelection(normalizedSelection);
  } /* else -- do not normalize */

  return tr;
};


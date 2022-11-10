
import { Fragment, Node as ProseMirrorNode, ResolvedPos, Slice } from 'prosemirror-model';
import { Selection, TextSelection, NodeSelection, SelectionRange, Transaction, EditorState } from 'prosemirror-state';
import { Mappable, Mapping } from 'prosemirror-transform';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { TableRole } from 'common';

import { inSameTable, pointsAtCell, setTableNodeAttributes, removeColSpan } from './util';
import { TableMap } from './TableMap';

// This file defines a ProseMirror selection subclass that models
// table cell selections. The table plugin needs to be active to wire
// in the user interaction part of table selections (so that you
// actually get such selections when you select across cells).

// ********************************************************************************
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
   * The positions given to the constructor should point before
   * two cells in the same table. They may be the same, to select a
   * single cell
   */
  constructor($anchorCell: ResolvedPos, $headCell: ResolvedPos = $anchorCell/*default to the same cell*/) {
    const table = $anchorCell.node(-1/*Table ancestor*/);
    const map = TableMap.get(table);
    const start = $anchorCell.start(-1/*Table ancestor depth*/);
    const rect = map.rectBetween($anchorCell.pos - start, $headCell.pos - start);
    const doc = $anchorCell.node(0);
    const cells = map.cellsInRect(rect).filter((pos: number) => pos !== $headCell.pos - start);

    // make the head Cell the first range so that it counts
    // as the primary part of the Selection
    cells.unshift($headCell.pos - start);
    const ranges = cells.filter(pos => table.nodeAt(pos)).map((pos: number) => {
      const cell = table.nodeAt(pos);
      const from = pos + start + 1;

      return new SelectionRange(doc.resolve(from), doc.resolve(from + cell/*guaranteed by filter*/!.content.size));
    });

    super(ranges[0].$from, ranges[0].$to, ranges);
    this.$anchorCell = $anchorCell;
    this.$headCell = $headCell;
  }

  // -- Method --------------------------------------------------------------------
  /** map a {@link CellSelection} through a {@link Mapping} */
  public map(doc: ProseMirrorNode, mapping: Mapping): Selection {
    const $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos));
    const $headCell = doc.resolve(mapping.map(this.$headCell.pos));

    if(pointsAtCell($anchorCell)
      && pointsAtCell($headCell)
      && inSameTable($anchorCell, $headCell)
    ) {
      const tableChanged = this.$anchorCell.node(-1) !== $anchorCell.node(-1);

      if(tableChanged && this.isRowSelection())
        return CellSelection.rowSelection($anchorCell, $headCell);
      else if(tableChanged && this.isColSelection())
        return CellSelection.colSelection($anchorCell, $headCell);
      else return new CellSelection($anchorCell, $headCell);
    }
    return TextSelection.between($anchorCell, $headCell);
  }

  /** returns a rectangular {@link Slice} of table rows containing the selected cells */
  public content() {
    const table = this.$anchorCell.node(-1);

    const map = TableMap.get(table);
    const start = this.$anchorCell.start(-1);

    const rect = map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start);
    const seen: { [key: number]: boolean; } = {};
    const rows = [];
    for(let row = rect.top; row < rect.bottom; row++) {
      let rowContent: ProseMirrorNode[] = [];

      for(let index = row * map.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
        const pos = map.map[index];

        if(!seen[pos]) {
          seen[pos] = true;
          const cellRect = map.findCell(pos);
          let cell = table.nodeAt(pos);

          if(cell) {
            const extraLeft = rect.left - cellRect.left,
              extraRight = cellRect.right - rect.right;

            if(extraLeft > 0 || extraRight > 0) {
              let { attrs } = cell;
              if(extraLeft > 0) attrs = removeColSpan(attrs, 0, extraLeft);

              if(extraRight > 0) {
                attrs = removeColSpan(attrs, attrs.colspan - extraRight, extraRight);
              } /* else -- extraRight is not bigger than 0 */

              if(cellRect.left < rect.left) {
                cell = cell.type.createAndFill(attrs);
              } else {
                cell = cell.type.create(attrs, cell.content);
              }
            } /* else -- neither extraLeft nor extraRight are bigger than 0*/

            if(cellRect.top < rect.top || cellRect.bottom > rect.bottom) {
              const attrs = cell && setTableNodeAttributes(cell.attrs, 'rowspan', Math.min(cellRect.bottom, rect.bottom) - Math.max(cellRect.top, rect.top));

              if(cell && cellRect.top < rect.top) { cell = cell.type.createAndFill(attrs); }
              else { cell = cell && cell.type.create(attrs, cell.content); }
            } /* else -- neither the cell rect top is smaller than the rect's top, nor the cell rect bottom is bigger than the rect bottom  */

            if(cell) {
              rowContent.push(cell);
            } /* else -- cell does not exist, nothing to add to the rowContent */

          } /* else -- there is no node at the cell pos*/
        } /* else -- already seen the cell at this position */
      }

      rows.push(table.child(row).copy(Fragment.from(rowContent)));
    }

    const fragment = this.isColSelection() && this.isRowSelection() ? table : rows;
    return new Slice(Fragment.from(fragment), 1/*Slice is open by 1 at start*/, 1/*Slice is open by 1 at end*/);
  }

  /** (SEE: {@link Selection} replace) */
  public replace(tr: Transaction, content = Slice.empty) {
    const mapFrom = tr.steps.length;
    const ranges = this.ranges;

    for(let i = 0; i < ranges.length; i++) {
      const { $from, $to } = ranges[i];
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

  /** execute the given callback for each cell in the Selection */
  public forEachCell(callback: (node: ProseMirrorNode | null, pos: number) => void) {
    const table = this.$anchorCell.node(-1);

    const map = TableMap.get(table);
    const start = this.$anchorCell.start(-1);
    const cells = map.cellsInRect(map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start));
    for(let i = 0; i < cells.length; i++) {
      callback(table.nodeAt(cells[i]), start + cells[i]);
    }
  }

  /**
   * return true if the Selection goes all the way from the
   * to to the bottom of the Table
   */
  public isColSelection() {
    const anchorTop = this.$anchorCell.index(-1);
    const headTop = this.$headCell.index(-1);

    if(Math.min(anchorTop, headTop) > 0) return false/*by definition*/;

    const anchorBot = anchorTop + this.$anchorCell.nodeAfter?.attrs.rowspan;
    const headBot = headTop + this.$headCell.nodeAfter?.attrs.rowspan;

    return Math.max(anchorBot, headBot) == this.$headCell.node(-1).childCount;
  }

  /**
   * return the smallest column Selection that cover the given
   * anchor and head cells
   */
  static colSelection($anchorCell: ResolvedPos, $headCell = $anchorCell) {
    const map = TableMap.get($anchorCell.node(-1));
    const start = $anchorCell.start(-1);
    const anchorRect = map.findCell($anchorCell.pos - start);
    const headRect = map.findCell($headCell.pos - start);

    const doc = $anchorCell.node(0/*doc depth*/);
    if(anchorRect.top <= headRect.top) {
      if(anchorRect.top > 0) {
        $anchorCell = doc.resolve(start + map.map[anchorRect.left]);
      } /* else -- anchor rect's top is not bigger than 0 */

      if(headRect.bottom < map.height) {
        $headCell = doc.resolve(start + map.map[map.width * (map.height - 1) + headRect.right - 1]);
      } /* else -- head rect's bottom is not smaller than the height of the map*/

    } else {
      if(headRect.top > 0) {
        $headCell = doc.resolve(start + map.map[headRect.left]);
      } /* else -- anchor rect's top is not bigger than 0 */

      if(anchorRect.bottom < map.height) {
        $anchorCell = doc.resolve(start + map.map[map.width * (map.height - 1) + anchorRect.right - 1]);
      } /* else -- head rect's bottom is not smaller than the height of the map*/
    }

    return new CellSelection($anchorCell, $headCell);
  }

  /**
   * return true if the Selection goes all the way from the left to
   * the right of the Table
   */
  public isRowSelection() {
    const map = TableMap.get(this.$anchorCell.node(-1));
    const start = this.$anchorCell.start(-1);

    const anchorLeft = map.colCount(this.$anchorCell.pos - start);
    const headLeft = map.colCount(this.$headCell.pos - start);

    if(Math.min(anchorLeft, headLeft) > 0) return false/*by definition*/;

    let anchorRight = anchorLeft + this.$anchorCell.nodeAfter?.attrs.colspan,
      headRight = headLeft + this.$headCell.nodeAfter?.attrs.colspan;

    return Math.max(anchorRight, headRight) == map.width;
  }

  /** (SEE: {@link Selection} eq) */
  public eq(other: Selection) {
    return (other instanceof CellSelection
      && other.$anchorCell.pos == this.$anchorCell.pos
      && other.$headCell.pos == this.$headCell.pos
    );
  }

  /**
   * return the smallest row Selection that covers the given anchor
   * and head cells
   */
  public static rowSelection($anchorCell: ResolvedPos, $headCell = $anchorCell) {
    const map = TableMap.get($anchorCell.node(-1));
    const start = $anchorCell.start(-1);
    const anchorRect = map.findCell($anchorCell.pos - start);
    const headRect = map.findCell($headCell.pos - start);

    const doc = $anchorCell.node(0/*doc depth*/);
    if(anchorRect.left <= headRect.left) {
      if(anchorRect.left > 0) {
        $anchorCell = doc.resolve(start + map.map[anchorRect.top * map.width]);
      } /* else -- anchor rect's left is not bigger than 0 */

      if(headRect.right < map.width) {
        $headCell = doc.resolve(start + map.map[map.width * (headRect.top + 1) - 1]);
      } /* else -- head rect's right is not smaller than the width of the map*/
    } else {
      if(headRect.left > 0) {
        $headCell = doc.resolve(start + map.map[headRect.top * map.width]);
      } /* else -- anchor rect's left is not bigger than 0 */
      if(anchorRect.right < map.width) {
        $anchorCell = doc.resolve(start + map.map[map.width * (anchorRect.top + 1) - 1]);
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
  public static create(doc: ProseMirrorNode, anchorCell: number, headCell = anchorCell): CellSelection {
    return new CellSelection(doc.resolve(anchorCell), doc.resolve(headCell));
  }

  /** (SEE: {@link Selection} getBookMark) */
  public getBookmark(): CellBookmark {
    return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos);
  }
}
CellSelection.prototype.visible = false;
Selection.jsonID('cell', CellSelection);

// == BookMark Class ==============================================================
class CellBookmark implements SelectionBookmark {
  // -- Attribute -----------------------------------------------------------------
  public anchor: number;
  public head: number;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(anchor: number, head: number) {
    this.anchor = anchor;
    this.head = head;
  }

  // -- Method --------------------------------------------------------------------
  /** (SEE: {@link SelectionBookmark} map) */
  public map(mapping: Mappable) {
    return new CellBookmark(mapping.map(this.anchor), mapping.map(this.head));
  }

  /** (SEE: {@link SelectionBookmark} resolve) */
  public resolve(doc: ProseMirrorNode) {
    let $anchorCell = doc.resolve(this.anchor),
      $headCell = doc.resolve(this.head);
    if(
      $anchorCell.parent.type.spec.tableRole === TableRole.Row &&
      $headCell.parent.type.spec.tableRole === TableRole.Row &&
      $anchorCell.index() < $anchorCell.parent.childCount &&
      $headCell.index() < $headCell.parent.childCount &&
      inSameTable($anchorCell, $headCell)
    )
      return new CellSelection($anchorCell, $headCell);
    else return Selection.near($headCell, 1);
  }
}

// == Util ========================================================================
/** add {@link Decoration}s for the selected cells in a {@link CellSelection} */
export const drawCellSelection = (state: EditorState) => {
  if(!(state.selection instanceof CellSelection)) return null/*nothing to do*/;

  const cellDecorations: Decoration[] = [];
  state.selection.forEachCell((node, pos) => {
    if(node) {
      cellDecorations.push(Decoration.node(pos, pos + node.nodeSize, { class: 'selectedCell' }));
    } /* else -- nothing to do */
  });

  return DecorationSet.create(state.doc, cellDecorations);
};

/** check if the Selection has a Cell boundary */
const isCellBoundarySelection = ({ $from, $to }: { $from: ResolvedPos; $to: ResolvedPos; }) => {
  if($from.pos === $to.pos || $from.pos < $from.pos - 6) return false/*cheap elimination*/;

  let afterFrom = $from.pos;
  let beforeTo = $to.pos;
  let depth = $from.depth;

  for(; depth >= 0; depth--, afterFrom++) {
    if($from.after(depth + 1) < $from.end(depth)) break;
  }

  for(let d = $to.depth; d >= 0; d--, beforeTo--) {
    if($to.before(d + 1) > $to.start(d)) break;
  }

  return (afterFrom === beforeTo &&/row|table/.test($from.node(depth).type.spec.tableRole));
};

/** check if the Selection is across cells */
const isTextSelectionAcrossCells = ({ $from, $to }: { $from: ResolvedPos; $to: ResolvedPos; }) => {
  let fromCellBoundaryNode;
  let toCellBoundaryNode;

  for(let i = $from.depth; i > 0; i--) {
    let node = $from.node(i);
    if(node.type.spec.tableRole === TableRole.Cell || node.type.spec.tableRole === TableRole.HeaderCell) {
      fromCellBoundaryNode = node;
      break;
    } /* else -- specs do not specify tableRole */
  }

  for(let i = $to.depth; i > 0; i--) {
    let node = $to.node(i);
    if(node.type.spec.tableRole === TableRole.Cell || node.type.spec.tableRole === TableRole.HeaderCell) {
      toCellBoundaryNode = node;
      break;
    } /* else -- specs do not specify tableRole */
  }

  return (fromCellBoundaryNode !== toCellBoundaryNode && $to.parentOffset === 0);
};

export const normalizeSelection = (newState: EditorState, allowTableNodeSelection: boolean, tr?: Transaction) => {
  const selection = (tr || newState).selection;
  const doc = (tr || newState).doc;
  let normalize;
  let role;

  if(selection instanceof NodeSelection && (role = selection.node.type.spec.tableRole)) {
    if(role == 'cell' || role == 'header_cell') {
      normalize = CellSelection.create(doc, selection.from);
    } else if(role == 'row') {
      let $cell = doc.resolve(selection.from + 1);
      normalize = CellSelection.rowSelection($cell, $cell);
    } else if(!allowTableNodeSelection) {
      const map = TableMap.get(selection.node);
      const start = selection.from + 1;
      const lastCell = start + map.map[map.width * map.height - 1];
      normalize = CellSelection.create(doc, start + 1, lastCell);
    }
  } else if(selection instanceof TextSelection && isCellBoundarySelection(selection)) {
    normalize = TextSelection.create(doc, selection.from);
  } else if(selection instanceof TextSelection && isTextSelectionAcrossCells(selection)) {
    normalize = TextSelection.create(doc, selection.$from.start(), selection.$from.end());
  }
  if(normalize) (tr || (tr = newState.tr)).setSelection(normalize);
  return tr;
};


import { EditorState, PluginKey, Transaction } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';

import { HISTORY_META } from '../../../../notebookEditor/command/type';
import { AttributeType } from '../../../attribute';
import { NodeName } from '../../../node';
import { TableMap } from '../class';
import { getTableNodeTypes, isTableNode } from '../node';
import { TableProblem } from '../type';
import { updateTableNodeAttributes, removeColumnSpans } from '../util';


// ********************************************************************************
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/fixtables.js

// helpers for normalizing Table Nodes, ensuring no Cells overlap and that each
// row has the same width, using problems reported by TableMap

// == Constant ====================================================================
const fixTablesKey = new PluginKey('fix-tables');

// == Fix =========================================================================
/**
 * inspect all Tables in the given State's Document and return a
 * Transaction that fixes them, if necessary. If 'oldState' is given
 * then that is assumed to hold a previous, known-good State, which
 * will be used to avoid re-scanning unchanged parts of the Document
 */
 export const fixTables = (oldState: EditorState | undefined/*validate descendants of newState*/, newState: EditorState): Transaction | undefined => {
  let tr: Transaction | undefined = undefined/*default*/;

  const check = (node: ProseMirrorNode, pos: number) =>  {
    if(isTableNode(node)) {
      tr = fixTable(newState, node, pos, tr);
      if(tr) {
        tr.setMeta(HISTORY_META, false/*do not add to history*/);
      } /* else -- Transaction was not modified */

    } /* else -- not a Table Node, ignore */
  };

  if(!oldState) {
    newState.doc.descendants(check);
  } else if(oldState.doc !== newState.doc) {
    changedDescendants(oldState.doc, newState.doc, 0/*no offset*/, check);
  }

  return tr;
};

/**
 * fix the given Table if necessary. Will append to the Transaction
 * it was given (i.e. if non null), or create a new one if necessary
 */
 export const fixTable = (state: EditorState, table: ProseMirrorNode, tablePos: number, tr?: Transaction) => {
  const tableMap = TableMap.getTableMap(table);
  if(!tableMap.problems) return tr/*nothing to do*/;

  if(!tr) {
    tr = state.tr;
  } /* else -- use the given Transaction */

  // track which rows need Cells removed so that they can be adjusted
  // when fixing collisions
  const mustAddCellAmounts = [/*default empty*/];
  for(let i = 0; i < tableMap.height; i++) {
    mustAddCellAmounts.push(0);
  }

  for(let i = 0; i < tableMap.problems.length; i++) {
    const tableMapProblem = tableMap.problems[i];
    if(tableMapProblem.type === TableProblem.Collision) {
      const cell = table.nodeAt(tableMapProblem.position);
      if(!cell) continue/*nothing to do*/;

      for(let j = 0; j < cell.attrs[AttributeType.RowSpan]; j++) {
        mustAddCellAmounts[tableMapProblem.row + j] += tableMapProblem.amount;
      }

      tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + tableMapProblem.position), null/*maintain type*/, removeColumnSpans(cell.attrs, cell.attrs[AttributeType.ColSpan] - tableMapProblem.amount, tableMapProblem.amount));
    } else if(tableMapProblem.type == TableProblem.Missing) {
      mustAddCellAmounts[tableMapProblem.row] += tableMapProblem.amount;
    } else if(tableMapProblem.type === TableProblem.OverlongRowSpan) {
      const cell = table.nodeAt(tableMapProblem.position);
      if(!cell) continue/*nothing to do*/;

      tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + tableMapProblem.position), null/*maintain type*/, updateTableNodeAttributes(cell.attrs, AttributeType.RowSpan, cell.attrs[AttributeType.RowSpan] - tableMapProblem.amount));
    } else if(tableMapProblem.type === TableProblem.ColWidthMistMatch) {
      const cell = table.nodeAt(tableMapProblem.position);
      if(!cell) continue/*nothing to do*/;

      tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + tableMapProblem.position), null/*maintain type*/, updateTableNodeAttributes(cell.attrs, AttributeType.ColWidth, tableMapProblem.colWidth));
    }
  }

  let firstPositionToAdd: number | null = null/*default*/;
  let lastPositionToAdd: number | null = null/*default*/;
  for(let i = 0; i < mustAddCellAmounts.length; i++) {
    if(mustAddCellAmounts[i]) {
      if(firstPositionToAdd === null) {
        firstPositionToAdd = i;
      } /* else -- already set the first position */

      lastPositionToAdd = i;
    } /* else -- no need to add */
  }

  // add the required Cells
  for(let rowIndex = 0, rowPosition = tablePos + 1/*inside the Table*/; rowIndex < tableMap.height; rowIndex++) {
    const row = table.child(rowIndex);
    const rowEnd = rowPosition + row.nodeSize;
    const amountOfCellsToAdd = mustAddCellAmounts[rowIndex];

    if(amountOfCellsToAdd > 0) {
      let typeToAdd = NodeName.CELL/*default*/;
      if(row.firstChild) {
        typeToAdd = row.firstChild.type.name as NodeName/*by definition*/;
      } /* else -- not the first child fo the row */

      const addedCells: ProseMirrorNode[] = [/*default empty*/];
      for(let j = 0; j < amountOfCellsToAdd; j++) {
        const requiredType = getTableNodeTypes(state.schema)[typeToAdd];
        const requiredNode = requiredType.createAndFill();

        if(requiredNode) {
          addedCells.push(requiredNode);
        } /* else -- could not create Node, do not add*/
      }

      let addedCellsInsertionPos = (rowIndex === 0/*first row*/ || firstPositionToAdd === rowIndex - 1/*previous row*/) && lastPositionToAdd === rowIndex ? rowPosition + 1/*start of row*/ : rowEnd - 1/*end of row but still inside it*/;
      tr.insert(tr.mapping.map(addedCellsInsertionPos), addedCells);
    }

    rowPosition = rowEnd;
  }

  return tr.setMeta(fixTablesKey, { fixTables: true });
};

// == Util ========================================================================
/**
 * iterate through the Nodes that changed in a Doc comparing it
 * to the previous one
 */
const changedDescendants = (oldDoc: ProseMirrorNode, currentDoc: ProseMirrorNode, offset: number, callback: (node: ProseMirrorNode, offset: number) => void) => {
  const oldChildCount = oldDoc.childCount,
        currentChildCount = currentDoc.childCount;

  outerLoop: for(let oldDocChildIndex = 0, currentDocChildIndex = 0; currentDocChildIndex < currentChildCount; currentDocChildIndex++) {
    const currentDocChild = currentDoc.child(currentDocChildIndex);

    for(let scanChildIndex = oldDocChildIndex, e = Math.min(oldChildCount, currentDocChildIndex + 3); scanChildIndex < e; scanChildIndex++) {
      if(oldDoc.child(scanChildIndex) === currentDocChild) {
        oldDocChildIndex = scanChildIndex + 1;
        offset += currentDocChild.nodeSize;
        continue outerLoop;
      } /* else -- does not equal the child, do nothing special */
    }

    callback(currentDocChild, offset);

    if(oldDocChildIndex < oldChildCount && oldDoc.child(oldDocChildIndex).sameMarkup(currentDocChild)) { changedDescendants(oldDoc.child(oldDocChildIndex), currentDocChild, offset + 1, callback); }
    else { currentDocChild.nodesBetween(0/*start of child*/, currentDocChild.content.size, callback, offset + 1/*start 1 past the offset*/); }

    offset += currentDocChild.nodeSize;
  }
};


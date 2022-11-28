import { AttributeType } from '../../../../notebookEditor/attribute';
import { defaultCell, cellWAnchor, cellWCursor, cellWDimension, cellWHead, cell, row, table,  emptyCell, emptyHeaderCell, executeTableTestCommand, headerCell, headerCellWCursor, tableDoc as doc, tableP as p } from '../../test/tableTestUtil';
import { CURSOR, NODE } from '../../test/testUtil';
import { addColumnAfterCommand, addColumnBeforeCommand, addRowAfterCommand, addRowBeforeCommand, deleteColumnCommand, deleteRowCommand } from './table';

// ********************************************************************************
// == Table Test ==================================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-commands.js

// -- Column ----------------------------------------------------------------------
describe('addColumnAfterCommand', () => {
  it('can add a plain column', () =>
    executeTableTestCommand(
      table(row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, cellWCursor, defaultCell),
            row(defaultCell, defaultCell, defaultCell)),

        addColumnAfterCommand,

      table(row(defaultCell, defaultCell, emptyCell, defaultCell),
            row(defaultCell, defaultCell, emptyCell, defaultCell),
            row(defaultCell, defaultCell, emptyCell, defaultCell)
      )
    ));

  it('can add a column at the right of the Table', () =>
    executeTableTestCommand(
      table(row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, defaultCell, cellWCursor)),

      addColumnAfterCommand,

      table(row(defaultCell, defaultCell, defaultCell, emptyCell),
            row(defaultCell, defaultCell, defaultCell, emptyCell),
            row(defaultCell, defaultCell, defaultCell, emptyCell)
      )
    ));

  it('can add a second Cell', () =>
    executeTableTestCommand(
      table(row(cellWCursor)),

      addColumnAfterCommand,

      table(row(defaultCell, emptyCell))
    ));

  it('can grow a ColSpan Cell', () =>
    executeTableTestCommand(
      table(row(cellWCursor, defaultCell), row(cellWDimension(2, 1))),

      addColumnAfterCommand,

      table(row(defaultCell, emptyCell, defaultCell), row(cellWDimension(3, 1)))
    ));

  it('places new Cells in the right spot when there are rowSpans', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWDimension(1, 2), cellWDimension(1, 2)),
            row(defaultCell),
            row(defaultCell, cellWCursor, defaultCell)),

      addColumnAfterCommand,

      table(row(defaultCell, cellWDimension(1, 2), emptyCell, cellWDimension(1, 2)),
            row(defaultCell, emptyCell),
            row(defaultCell, defaultCell, emptyCell, defaultCell))
    ));

  it('can place new Cells into an empty row', () =>
    executeTableTestCommand(
      table(row(cellWDimension(1, 2), cellWDimension(1, 2)),
            row(),
            row(cellWCursor, defaultCell)),

      addColumnAfterCommand,

      table(row(cellWDimension(1, 2), emptyCell, cellWDimension(1, 2)),
            row(emptyCell),
            row(defaultCell, emptyCell, defaultCell))
    ));

  it('will skip ahead when growing a rowSpan Cell', () =>
    executeTableTestCommand(
      table(row(cellWDimension(2, 2), defaultCell),
            row(defaultCell),
            row(cellWCursor, defaultCell, defaultCell)),

      addColumnAfterCommand,

      table(row(cellWDimension(3, 2), defaultCell),
            row(defaultCell),
            row(cellWCursor, emptyCell, defaultCell, defaultCell))
    ));

  it('will use the right side of a single CellSelection', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, defaultCell),
            row(defaultCell, defaultCell)),

      addColumnAfterCommand,

      table(row(defaultCell, emptyCell, defaultCell),
            row(defaultCell, emptyCell, defaultCell))
    ));

  it('will use the right side of a bigger CellSelection', () =>
    executeTableTestCommand(
      table(row(cellWHead, defaultCell, defaultCell),
            row(defaultCell, cellWAnchor, defaultCell)),

      addColumnAfterCommand,

      table(row(defaultCell, defaultCell, emptyCell, defaultCell),
            row(defaultCell, defaultCell, emptyCell, defaultCell))
    ));

  it('properly handles a Cell NodeSelection', () =>
    executeTableTestCommand(
      table(row(`<${NODE}>`, defaultCell, defaultCell),
            row(defaultCell, defaultCell)),

      addColumnAfterCommand,

      table(row(defaultCell, emptyCell, defaultCell),
            row(defaultCell, emptyCell, defaultCell))
    ));

  it('preserves HeaderCell rows', () =>
    executeTableTestCommand(
      table(row(headerCell, headerCell),
            row(defaultCell, cellWCursor)),

      addColumnAfterCommand,

      table(row(headerCell, headerCell, emptyHeaderCell),
            row(defaultCell, defaultCell, emptyCell))
    ));

  it('uses column after as reference when header column before is present', () =>
    executeTableTestCommand(
      table(row(headerCell, headerCell),
            row(headerCellWCursor, defaultCell)),

      addColumnAfterCommand,

      table(row(headerCell, emptyHeaderCell, headerCell),
            row(headerCell, emptyCell, defaultCell))
    ));

  it('creates regular cells when only next to a header column', () =>
    executeTableTestCommand(
      table(row(defaultCell, headerCell),
            row(defaultCell, headerCellWCursor)),

      addColumnAfterCommand,

      table(row(defaultCell, headerCell, emptyCell),
            row(defaultCell, headerCell, emptyCell))
    ));

  it('does nothing outside of a Table', () =>
    executeTableTestCommand(doc(p(`foo<${CURSOR}>`)), addColumnAfterCommand, null/*expect to return false*/));

  it('preserves column widths', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, defaultCell),
            row(cell({ [AttributeType.ColSpan]: 2, [AttributeType.ColWidth]: [100, 200] }, p('a')))
      ),

      addColumnAfterCommand,

      table(row(cellWAnchor, emptyCell, defaultCell),
            row(cell({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 0, 200] }, p('a')))
      )
    ));
});

describe('addColumnBeforeCommand', () => {
  it('can add a plain column', () =>
    executeTableTestCommand(
      table(row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, cellWCursor, defaultCell),
            row(defaultCell, defaultCell, defaultCell)),

      addColumnBeforeCommand,

      table(row(defaultCell, emptyCell, defaultCell, defaultCell),
            row(defaultCell, emptyCell, defaultCell, defaultCell),
            row(defaultCell, emptyCell, defaultCell, defaultCell)
      )
    ));

  it('can add a column at the left of the Table', () =>
    executeTableTestCommand(
      table(row(cellWCursor, defaultCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell)),

      addColumnBeforeCommand,

      table(row(emptyCell, defaultCell, defaultCell, defaultCell),
            row(emptyCell, defaultCell, defaultCell, defaultCell),
            row(emptyCell, defaultCell, defaultCell, defaultCell)
      )
    ));

  it('will use the left side of a single CellSelection', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, defaultCell),
            row(defaultCell, defaultCell)),

      addColumnBeforeCommand,

      table(row(emptyCell, defaultCell, defaultCell),
            row(emptyCell, defaultCell, defaultCell))
    ));

  it('will use the left side of a bigger CellSelection', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWHead, defaultCell),
            row(defaultCell, defaultCell, cellWAnchor)),

      addColumnBeforeCommand,

      table(row(defaultCell, emptyCell, defaultCell, defaultCell),
            row(defaultCell, emptyCell, defaultCell, defaultCell))
    ));

  it('preserves header rows', () =>
    executeTableTestCommand(
      table(row(headerCell, headerCell),
            row(cellWCursor, defaultCell)),

      addColumnBeforeCommand,

      table(row(emptyHeaderCell, headerCell, headerCell),
            row(emptyCell, defaultCell, defaultCell))
    ));
});

describe('deleteColumnCommand', () => {
  it('can delete a plain column', () =>
    executeTableTestCommand(
      table(row(emptyCell, defaultCell, defaultCell),
            row(defaultCell, cellWCursor, defaultCell),
            row(defaultCell, defaultCell, emptyCell)),

      deleteColumnCommand,

      table(row(emptyCell, defaultCell),
            row(defaultCell, defaultCell),
            row(defaultCell, emptyCell))
    ));

  it('can delete the first column', () =>
    executeTableTestCommand(
      table(row(cellWCursor, emptyCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell)),

      deleteColumnCommand,

      table(row(emptyCell, defaultCell),
            row(defaultCell, defaultCell),
            row(defaultCell, defaultCell))
    ));

  it('can delete the last column', () =>
    executeTableTestCommand(
      table(row(defaultCell, emptyCell, cellWCursor),
            row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell)),

      deleteColumnCommand,

      table(row(defaultCell, emptyCell),
            row(defaultCell, defaultCell),
            row(defaultCell, defaultCell))
    ));

  it('can reduce a Cell ColSpan', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWCursor),
            row(cellWDimension(2, 1))),

      deleteColumnCommand,

      table(row(defaultCell),
            row(defaultCell))
    ));

  it('will skip rows after a rowSpan', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWCursor),
            row(defaultCell, cellWDimension(1, 2)),
            row(defaultCell)),

      deleteColumnCommand,

      table(row(defaultCell),
            row(defaultCell),
            row(defaultCell))
    ));

  it('will delete all columns under a colSpan Cell', () =>
    executeTableTestCommand(
      table(row(defaultCell, cell({ [AttributeType.ColSpan]: 2 }, p(`<${CURSOR}>`))),
            row(emptyCell, defaultCell, defaultCell)),

      deleteColumnCommand,

      table(row(defaultCell),
            row(emptyCell))
    ));

  it('deletes a Cell selected column', () =>
    executeTableTestCommand(
      table(row(emptyCell, cellWAnchor),
            row(defaultCell, cellWHead)),

      deleteColumnCommand,

      table(row(emptyCell),
            row(defaultCell))
    ));

  it('deletes multiple Cell selected columns', () =>
    executeTableTestCommand(
      table(row(cellWDimension(1, 2), cellWAnchor, defaultCell),
            row(defaultCell, emptyCell),
            row(cellWHead, defaultCell, defaultCell)),

      deleteColumnCommand,

      table(row(defaultCell),
            row(emptyCell),
            row(defaultCell))
    ));

  it('leaves column widths intact', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWAnchor, defaultCell),
            row(cell({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 200, 300] }, p('y')))),

      deleteColumnCommand,

      table(row(defaultCell, defaultCell), row(cell({ [AttributeType.ColSpan]: 2, [AttributeType.ColWidth]: [100, 300] }, p('y'))))
    ));

  it('resets column width when all zeroes', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWAnchor, defaultCell),
            row(cell({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [0, 200, 0] }, p('y')))),

      deleteColumnCommand,

      table(row(defaultCell, defaultCell),
            row(cell({ [AttributeType.ColSpan]: 2 }, p('y'))))
    ));
});

// -- Row -------------------------------------------------------------------------
describe('addRowAfterCommand', () => {
  it('can add a simple row', () =>
    executeTableTestCommand(
      table(row(cellWCursor, defaultCell),
            row(defaultCell, defaultCell)),

      addRowAfterCommand,

      table(row(defaultCell, defaultCell),
            row(emptyCell, emptyCell),
            row(defaultCell, defaultCell))
    ));

  it('can add a row at the end', () =>
    executeTableTestCommand(
      table(row(defaultCell, defaultCell),
            row(defaultCell, cellWCursor)),

      addRowAfterCommand,

      table(row(defaultCell, defaultCell),
            row(defaultCell, defaultCell),
            row(emptyCell, emptyCell))
    ));

  it('increases rowspan when needed', () =>
    executeTableTestCommand(
      table(row(cellWCursor, cellWDimension(1, 2)),
            row(defaultCell)),

      addRowAfterCommand,

      table(row(defaultCell, cellWDimension(1, 3)),
            row(emptyCell),
            row(defaultCell))
    ));

  it('skips columns for colSpan Cells', () =>
    executeTableTestCommand(
      table(row(cellWCursor, cellWDimension(2, 2)),
            row(defaultCell)),

      addRowAfterCommand,

      table(row(defaultCell, cellWDimension(2, 3)),
            row(emptyCell), row(defaultCell))
    ));

  it('picks the row after a CellSelection', () =>
    executeTableTestCommand(
      table(row(cellWHead, defaultCell, defaultCell),
            row(defaultCell, cellWAnchor, defaultCell),
            row(cellWDimension(3, 1))),

      addRowAfterCommand,

      table(row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell),
            row(emptyCell, emptyCell, emptyCell),
            row(cellWDimension(3, 1))
      )
    ));

  it('preserves header columns', () =>
    executeTableTestCommand(
      table(row(defaultCell, headerCellWCursor),
            row(defaultCell, headerCell)),

      addRowAfterCommand,

      table(row(defaultCell, headerCell),
            row(emptyCell, emptyHeaderCell),
            row(defaultCell, headerCell))
    ));

  it('uses next row as reference when row before is a header', () =>
    executeTableTestCommand(
      table(row(headerCell, headerCellWCursor),
            row(defaultCell, headerCell)),

      addRowAfterCommand,

      table(row(headerCell, headerCell),
            row(emptyCell, emptyHeaderCell),
            row(defaultCell, headerCell))
    ));

  it('creates regular Cells when no reference row is available', () =>
    executeTableTestCommand(
      table(row(headerCell, headerCellWCursor)),

      addRowAfterCommand,

      table(row(headerCell, headerCell),
            row(emptyCell, emptyCell))
    ));
});

describe('addRowBeforeCommand', () => {
  it('can add a simple row', () =>
    executeTableTestCommand(
      table(row(defaultCell, defaultCell),
            row(cellWCursor, defaultCell)),

      addRowBeforeCommand,

      table(row(defaultCell, defaultCell),
            row(emptyCell, emptyCell),
            row(defaultCell, defaultCell))
    ));

  it('can add a row at the start', () =>
    executeTableTestCommand(
      table(row(cellWCursor, defaultCell),
            row(defaultCell, defaultCell)),

      addRowBeforeCommand,

      table(row(emptyCell, emptyCell),
            row(defaultCell, defaultCell),
            row(defaultCell, defaultCell))
    ));

  it('picks the row before a CellSelection', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWDimension(2, 1)),
            row(cellWAnchor, defaultCell, defaultCell),
            row(defaultCell, cellWHead, defaultCell)),

      addRowBeforeCommand,

      table(row(defaultCell, cellWDimension(2, 1)),
            row(emptyCell, emptyCell, emptyCell),
            row(defaultCell, defaultCell, defaultCell),
            row(defaultCell, defaultCell, defaultCell)
      )
    ));

  it('preserves header columns', () =>
    executeTableTestCommand(
      table(row(headerCellWCursor, defaultCell),
            row(headerCell, defaultCell)),

      addRowBeforeCommand,

      table(row(emptyHeaderCell, emptyCell),
            row(headerCell, defaultCell),
            row(headerCell, defaultCell))
    ));
});

describe('deleteRowCommand', () => {
  it('can delete a simple row', () =>
    executeTableTestCommand(
      table(row(defaultCell, emptyCell),
            row(cellWCursor, defaultCell),
            row(defaultCell, emptyCell)),

      deleteRowCommand,

      table(row(defaultCell, emptyCell),
            row(defaultCell, emptyCell))
    ));

  it('can delete the first row', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWCursor),
            row(emptyCell, defaultCell),
            row(defaultCell, emptyCell)),

      deleteRowCommand,

      table(row(emptyCell, defaultCell),
            row(defaultCell, emptyCell))
    ));

  it('can delete the last row', () =>
    executeTableTestCommand(
      table(row(emptyCell, defaultCell),
            row(defaultCell, emptyCell),
            row(defaultCell, cellWCursor)),

      deleteRowCommand,

      table(row(emptyCell, defaultCell),
            row(defaultCell, emptyCell))
    ));

  it('can shrink rowspan cells', () =>
    executeTableTestCommand(
      table(row(cellWDimension(1, 2), defaultCell, cellWDimension(1, 3)),
            row(cellWCursor),
            row(defaultCell, defaultCell)),

      deleteRowCommand,

      table(row(defaultCell, defaultCell, cellWDimension(1, 2)),
            row(defaultCell, defaultCell))
    ));

  it('can move cells that start in the deleted row', () =>
    executeTableTestCommand(
      table(row(cellWDimension(1, 2), cellWCursor),
            row(emptyCell)),

      deleteRowCommand,

      table(row(defaultCell, emptyCell))
    ));

  it('deletes multiple rows when the start cell has a rowSpan', () =>
    executeTableTestCommand(
      table(row(cell({ [AttributeType.RowSpan]: 3 }, p(`<${CURSOR}>`)), defaultCell),
            row(defaultCell),
            row(defaultCell),
            row(defaultCell, defaultCell)
      ),

      deleteRowCommand,

      table(row(defaultCell, defaultCell))
    ));

  it('skips columns when adjusting rowSpan', () =>
    executeTableTestCommand(
      table(row(cellWCursor, cellWDimension(2, 2)),
            row(defaultCell)),

      deleteRowCommand,

      table(row(defaultCell, cellWDimension(2, 1)))
    ));

  it('can delete a CellSelection', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, defaultCell),
            row(defaultCell, emptyCell)),

      deleteRowCommand,

      table(row(defaultCell, emptyCell))
    ));

  it('will delete all rows in the CellSelection', () =>
    executeTableTestCommand(
      table(row(defaultCell, emptyCell),
            row(cellWAnchor, defaultCell),
            row(defaultCell, cellWHead),
            row(emptyCell, defaultCell)),

      deleteRowCommand,

      table(row(defaultCell, emptyCell),
            row(emptyCell, defaultCell))
    ));
});


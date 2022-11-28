import { defaultCell, cellWCursor, cellWDimension, row, table, executeTableTestCommand, headerCell, headerCellWCursor, headerCellWDimension, tableDoc as doc, tableP as p } from '../../test/tableTestUtil';
import { toggleHeaderColumnCommand, toggleHeaderCommand, toggleHeaderRowCommand } from './headerCell';

// ********************************************************************************
// == Header Cell =================================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-commands.js

describe('toggleHeaderRowCommand', () => {
  it('turns a non-header row into header', () =>
    executeTableTestCommand(
      doc(table(row(cellWCursor, defaultCell),
                row(defaultCell, defaultCell))),

      toggleHeaderRowCommand,

      doc(table(row(headerCell, headerCell),
                row(defaultCell, defaultCell)))
    ));

  it('turns a header row into regular Cells', () =>
    executeTableTestCommand(
      doc(table(row(headerCellWCursor, headerCell),
                row(defaultCell, defaultCell))),

      toggleHeaderRowCommand,

      doc(table(row(defaultCell, defaultCell),
                row(defaultCell, defaultCell)))
    ));

  it('turns a partial header row into a header Row', () =>
    executeTableTestCommand(
      doc(table(row(cellWCursor, headerCell),
                row(defaultCell, defaultCell))),

      toggleHeaderRowCommand,

      doc(table(row(headerCell, headerCell),
                row(defaultCell, defaultCell)))
    ));

  it('leaves cell spans intact', () =>
    executeTableTestCommand(
      doc(table(row(cellWCursor, cellWDimension(2, 2)),
                row(defaultCell),
                row(defaultCell, defaultCell, defaultCell))),

      toggleHeaderRowCommand,

      doc(table(row(headerCell, headerCellWDimension(2, 2)),
                row(defaultCell),
                row(defaultCell, defaultCell, defaultCell)))
    ));
});

describe('toggleHeaderColumnCommand', () => {
  it('turns a non-header column into header', () =>
    executeTableTestCommand(
      doc(table(row(cellWCursor, defaultCell),
                row(defaultCell, defaultCell))),

      toggleHeaderColumnCommand,

      doc(table(row(headerCell, defaultCell),
                row(headerCell, defaultCell)))
    ));

  it('turns a header column into regular Cells', () =>
    executeTableTestCommand(
      doc(table(row(headerCellWCursor, headerCell),
                row(headerCell, defaultCell))),

      toggleHeaderColumnCommand,

      doc(table(row(headerCell, headerCell),
                row(defaultCell, defaultCell)))
    ));

  it('turns a partial header column into a header Column', () =>
    executeTableTestCommand(
      doc(table(row(headerCellWCursor, defaultCell),
                row(defaultCell, defaultCell))),

      toggleHeaderColumnCommand,

      doc(table(row(headerCell, defaultCell),
                row(headerCell, defaultCell)))
    ));
});

describe('toggleHeaderCommand', () => {
  it('turns a header row with colspan and rowspan into a regular cell', () =>
    executeTableTestCommand(
      doc(p('x'),
          table(row(headerCellWDimension(2, 1), headerCellWDimension(1, 2)),
                row(cellWCursor, defaultCell),
                row(defaultCell, defaultCell, defaultCell))
      ),

      toggleHeaderCommand('row'),

      doc(p('x'),
          table(row(cellWDimension(2, 1), cellWDimension(1, 2)),
                row(cellWCursor, defaultCell),
                row(defaultCell, defaultCell, defaultCell))
      )
    ));

  it('turns a header column with colspan and rowspan into a regular cell', () =>
    executeTableTestCommand(
      doc(p('x'),
          table(row(headerCellWDimension(2, 1), headerCellWDimension(1, 2)),
                row(cellWCursor, defaultCell),
                row(defaultCell, defaultCell, defaultCell))
      ),

      toggleHeaderCommand('column'),

      doc(p('x'),
          table(row(headerCellWDimension(2, 1), headerCellWDimension(1, 2)),
                row(headerCell, defaultCell),
                row(headerCell, defaultCell, defaultCell)))
    ));

  it('should keep first cell as header when the column header is enabled', () =>
    executeTableTestCommand(
      doc(p('x'),
          table(row(headerCell, defaultCell),
                row(headerCellWCursor, defaultCell),
                row(headerCell, defaultCell))),

      toggleHeaderCommand('row'),

      doc(p('x'),
          table(row(headerCell, headerCell),
                row(headerCell, defaultCell),
                row(headerCell, defaultCell)))
    ));

  describe('new behavior', () => {
    it('turns a header column into regular Cells without override header row', () =>
      executeTableTestCommand(
        doc(table(row(headerCellWCursor, headerCell),
                  row(headerCell, defaultCell))),

        toggleHeaderCommand('column'),

        doc(table(row(headerCellWCursor, headerCell),
                  row(defaultCell, defaultCell)))
      ));
  });
});

import { cellBuilder, cellWithCursorBuilder, cellWithDimensionBuilder, defaultRowBuilder, defaultTableBuilder, executeTableTestCommand, headerCellBuilder, headerCellWithCursorBuilder, headerCellWithDimensionBuilder, tableDocBuilder, tableParagraphBuilder } from '../../test/tableTestUtil';
import { toggleHeaderColumnCommand, toggleHeaderCommand, toggleHeaderRowCommand } from './headerCell';

// ********************************************************************************
// == Header Cell =================================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-commands.js

describe('toggleHeaderRowCommand', () => {
  it('turns a non-header row into header', () =>
    executeTableTestCommand(
      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('turns a header row into regular Cells', () =>
    executeTableTestCommand(
      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('turns a partial header row into a header Row', () =>
    executeTableTestCommand(
      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('leaves cell spans intact', () =>
    executeTableTestCommand(
      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, cellWithDimensionBuilder(2, 2)),
          defaultRowBuilder(cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellWithDimensionBuilder(2, 2)),
          defaultRowBuilder(cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)))
    ));
});

describe('toggleHeaderColumnCommand', () => {
  it('turns a non-header column into header', () =>
    executeTableTestCommand(
      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderColumnCommand,

      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder)))
    ));

  it('turns a header column into regular Cells', () =>
    executeTableTestCommand(
      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder))),

      toggleHeaderColumnCommand,

      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('turns a partial header column into a header Column', () =>
    executeTableTestCommand(
      tableDocBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderColumnCommand,

      tableDocBuilder(
        defaultTableBuilder(defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder)))
    ));
});

describe('toggleHeaderCommand', () => {
  it('turns a header row with colspan and rowspan into a regular cell', () =>
    executeTableTestCommand(
      tableDocBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithDimensionBuilder(2, 1), headerCellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
      ),

      toggleHeaderCommand('row'),

      tableDocBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
      )
    ));

  it('turns a header column with colspan and rowspan into a regular cell', () =>
    executeTableTestCommand(
      tableDocBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithDimensionBuilder(2, 1), headerCellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
      ),

      toggleHeaderCommand('column'),

      tableDocBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithDimensionBuilder(2, 1), headerCellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder, cellBuilder)))
    ));

  it('should keep first cell as header when the column header is enabled', () =>
    executeTableTestCommand(
      tableDocBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder))),

      toggleHeaderCommand('row'),

      tableDocBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder)))
    ));

  describe('new behavior', () => {
    it('turns a header column into regular Cells without override header row', () =>
      executeTableTestCommand(
        tableDocBuilder(
          defaultTableBuilder(
            defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
            defaultRowBuilder(headerCellBuilder, cellBuilder))),

        toggleHeaderCommand('column'),

        tableDocBuilder(
          defaultTableBuilder(
            defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
            defaultRowBuilder(cellBuilder, cellBuilder)))
      ));
  });
});

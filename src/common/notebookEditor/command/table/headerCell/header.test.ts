import { NodeName } from '../../../../notebookEditor/node';
import { cellBuilder, cellWithCursorBuilder, cellWithDimensionBuilder, defaultRowBuilder, defaultTableBuilder, executeTableTestCommand, headerCellBuilder, headerCellWithCursorBuilder, headerCellWithDimensionBuilder, tableParagraphBuilder } from '../../test/tableTestUtil';
import { getNotebookSchemaNodeBuilders } from '../../test/testUtil';
import { toggleHeaderColumnCommand, toggleHeaderCommand, toggleHeaderRowCommand } from './headerCell';

// ********************************************************************************
// == Constant ====================================================================
const { [NodeName.DOC]: docBuilder } = getNotebookSchemaNodeBuilders([NodeName.DOC]);

// -- Header Cell -----------------------------------------------------------------
describe('toggleHeaderRowCommand', () => {
  it('turns a non-header row into header', () =>
    executeTableTestCommand(
      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('turns a header row into regular cells', () =>
    executeTableTestCommand(
      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      docBuilder(
        defaultTableBuilder(defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('turns a partial header row into regular cells', () =>
    executeTableTestCommand(
      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('leaves cell spans intact', () =>
    executeTableTestCommand(
      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, cellWithDimensionBuilder(2, 2)),
          defaultRowBuilder(cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))),

      toggleHeaderRowCommand,

      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellWithDimensionBuilder(2, 2)),
          defaultRowBuilder(cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)))
    ));
});

describe('toggleHeaderColumnCommand', () => {
  it('turns a non-header column into header', () =>
    executeTableTestCommand(
      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderColumnCommand,

      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder)))
    ));

  it('turns a header column into regular cells', () =>
    executeTableTestCommand(
      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder))),

      toggleHeaderColumnCommand,

      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(cellBuilder, headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)))
    ));

  it('turns a partial header column into regular cells', () =>
    executeTableTestCommand(
      docBuilder(
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      toggleHeaderColumnCommand,

      docBuilder(
        defaultTableBuilder(defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)))
    ));
});

describe('toggleHeaderCommand', () => {
  it('turns a header row with colspan and rowspan into a regular cell', () =>
    executeTableTestCommand(
      docBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithDimensionBuilder(2, 1), headerCellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
      ),

      toggleHeaderCommand('row'),

      docBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
      )
    ));

  it('turns a header column with colspan and rowspan into a regular cell', () =>
    executeTableTestCommand(
      docBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithDimensionBuilder(2, 1), headerCellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
      ),

      toggleHeaderCommand('column'),

      docBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellWithDimensionBuilder(2, 1), headerCellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder, cellBuilder)))
    ));

  it('should keep first cell as header when the column header is enabled', () =>
    executeTableTestCommand(
      docBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder))),

      toggleHeaderCommand('row'),

      docBuilder(
        tableParagraphBuilder('x'),
        defaultTableBuilder(
          defaultRowBuilder(headerCellBuilder, headerCellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder),
          defaultRowBuilder(headerCellBuilder, cellBuilder)))
    ));

  describe('new behavior', () => {
    it('turns a header column into regular cells without override header row', () =>
      executeTableTestCommand(
        docBuilder(
          defaultTableBuilder(
            defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
            defaultRowBuilder(headerCellBuilder, cellBuilder))),

        toggleHeaderCommand('column'),

        docBuilder(
          defaultTableBuilder(
            defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder),
            defaultRowBuilder(cellBuilder, cellBuilder)))
      ));
  });
});

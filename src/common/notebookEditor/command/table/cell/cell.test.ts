import { Command, EditorState } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { NodeName } from '../../../../notebookEditor/node';
import { cellBuilder, cellWithAnchorBuilder, cellWithCursorBuilder, cellWithDimensionBuilder, cellWithHeadBuilder, defaultCellBuilder, defaultHeaderCellBuilder, defaultRowBuilder, defaultTableBuilder, emptyCellBuilder, emptyHeaderCellBuilder, executeTableTestCommand, tableParagraphBuilder } from '../../test/tableTestUtil';
import { ANCHOR, CURSOR } from '../../test/testUtil';

import { mergeCellsCommand, splitCellCommand, GetCellTypeFunctionType } from './cell';

// == Cell Test ===================================================================
describe('mergeCellsCommand', () => {
  it('does not do anything when only one Cell is selected', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder)),

      mergeCellsCommand,

      null/*expect to return false*/
    ));

  it('does not do anything when the selection cuts across spanning Cells', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellWithDimensionBuilder(2, 1)),
        defaultRowBuilder(cellBuilder, cellWithHeadBuilder, cellBuilder)),

      mergeCellsCommand,

      null/*expect to return false*/
    ));

  it('can merge two Cells in a column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellWithHeadBuilder, cellBuilder)),

      mergeCellsCommand,

      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder))
    ));

  it('can merge two Cells in a row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(cellWithHeadBuilder, cellBuilder)),

      mergeCellsCommand,

      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.RowSpan]: 2 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
        defaultRowBuilder(cellBuilder))
    ));

  it('can merge a rectangle of Cells', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, emptyCellBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder, cellWithHeadBuilder, cellBuilder)
      ),

      mergeCellsCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, defaultCellBuilder({ [AttributeType.RowSpan]: 2, [AttributeType.ColSpan]: 3 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)
      )
    ));

  it('can merge already spanning Cells', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellWithDimensionBuilder(1, 2), emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellWithHeadBuilder, cellBuilder)),

      mergeCellsCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, defaultCellBuilder({ [AttributeType.RowSpan]: 2, [AttributeType.ColSpan]: 3 }, tableParagraphBuilder('x'), tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('keeps the column width of the first column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColWidth]: [100] }, tableParagraphBuilder(`x<${ANCHOR}>`)), cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithHeadBuilder)),

      mergeCellsCommand,

      defaultTableBuilder(
        defaultRowBuilder(
          defaultCellBuilder(
            { [AttributeType.ColSpan]: 2, [AttributeType.RowSpan]: 2, [AttributeType.ColWidth]: [100, 0] },
            tableParagraphBuilder('x'),
            tableParagraphBuilder('x'),
            tableParagraphBuilder('x'),
            tableParagraphBuilder('x')
          )
        ),
        defaultRowBuilder()
      )
    ));
});

describe('splitCellCommand', () => {
  it('does nothing when cursor is inside of a Cell with attributes colSpan = 1 and rowSpan = 1', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder)),

        splitCellCommand(),

        null/*expect to return false*/
    ));

  it('can split col-spanning Cell with cursor', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${CURSOR}>`)), cellBuilder)),

      splitCellCommand(),

      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder))
    ));

  it('can split when col-spanning HeaderCell with cursor', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(defaultHeaderCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${CURSOR}>`)))),

      splitCellCommand(),

      defaultTableBuilder(
        defaultRowBuilder(defaultHeaderCellBuilder(tableParagraphBuilder('foo')), emptyHeaderCellBuilder))
    ));

  it('does nothing for a multi-CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellWithHeadBuilder, cellBuilder)),

        splitCellCommand(),

        null/*expect to return false*/
    ));

  it('does nothing when the selected Cell does not span anything', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder)),

        splitCellCommand(),

        null/*expect to return false*/
    ));

  it('can split a col-spanning Cell', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder)),

      splitCellCommand(),

      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder))
    ));

  it('can split a row-spanning Cell', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, defaultCellBuilder({ [AttributeType.RowSpan]: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      splitCellCommand(),

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, defaultCellBuilder(tableParagraphBuilder('foo')), cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
    ));

  it('can split a rectangular Cell', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(4, 1)),
        defaultRowBuilder(cellBuilder, defaultCellBuilder({ [AttributeType.RowSpan]: 2, [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)
      ),

      splitCellCommand(),

      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(4, 1)),
        defaultRowBuilder(cellBuilder, defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder, cellBuilder)
      )
    ));

  it('distributes column widths', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 0, 200] }, tableParagraphBuilder(`a<${ANCHOR}>`)))),

      splitCellCommand(),

      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColWidth]: [100] }, tableParagraphBuilder('a')), emptyCellBuilder, defaultCellBuilder({ [AttributeType.ColWidth]: [200] }, tableParagraphBuilder())))
    ));

  describe('with custom Cell type', () => {
    const createGetCellTypeFunction = (state: EditorState): GetCellTypeFunctionType => (state, row, col, node) =>
      row === 0
        ? state.schema.nodes[NodeName.HEADER_CELL]
        :  state.schema.nodes[NodeName.CELL];

    const splitCellWithOnlyHeaderInColumnZero: Command = (state, dispatch) => splitCellCommand(createGetCellTypeFunction(state))(state, dispatch);
    it('can split a row-spanning header Cell into a header and normal Cell ', () =>
      executeTableTestCommand(
        defaultTableBuilder(
          defaultRowBuilder(cellBuilder, defaultCellBuilder({ [AttributeType.RowSpan]: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder)),

        splitCellWithOnlyHeaderInColumnZero,

        defaultTableBuilder(
          defaultRowBuilder(cellBuilder, defaultHeaderCellBuilder(tableParagraphBuilder('foo')), cellBuilder),
          defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
      ));
  });
});

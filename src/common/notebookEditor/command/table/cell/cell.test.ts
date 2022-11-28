import { Command, EditorState } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { NodeName } from '../../../../notebookEditor/node';
import { defaultCell, cellWAnchor, cellWCursor, cellWDimension, cellWHead, cell, hCell, row, table, emptyCell, emptyHeaderCell, executeTableTestCommand, tableP as p } from '../../test/tableTestUtil';
import { ANCHOR, CURSOR } from '../../test/testUtil';

import { mergeCellsCommand, splitCellCommand, GetCellTypeFunctionType } from './cell';

// ********************************************************************************
// == Cell Test ===================================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-commands.js

describe('mergeCellsCommand', () => {
  it('does not do anything when only one Cell is selected', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, defaultCell)),

      mergeCellsCommand,

      null/*expect to return false*/
    ));

  it('does not do anything when the selection cuts across spanning Cells', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, cellWDimension(2, 1)),
            row(defaultCell, cellWHead, defaultCell)),

      mergeCellsCommand,

      null/*expect to return false*/
    ));

  it('can merge two Cells in a column', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, cellWHead, defaultCell)),

      mergeCellsCommand,

      table(row(cell({ [AttributeType.ColSpan]: 2 }, p('x'), p('x')), defaultCell))
    ));

  it('can merge two Cells in a row', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, defaultCell),
            row(cellWHead, defaultCell)),

      mergeCellsCommand,

      table(row(cell({ [AttributeType.RowSpan]: 2 }, p('x'), p('x')), defaultCell),
            row(defaultCell))
    ));

  it('can merge a rectangle of Cells', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWAnchor, emptyCell, emptyCell, defaultCell),
            row(defaultCell, emptyCell, emptyCell, cellWHead, defaultCell)
      ),

      mergeCellsCommand,

      table(row(defaultCell, cell({ [AttributeType.RowSpan]: 2, [AttributeType.ColSpan]: 3 }, p('x'), p('x')), defaultCell),
            row(defaultCell, defaultCell)
      )
    ));

  it('can merge already spanning Cells', () =>
    executeTableTestCommand(
      table(row(defaultCell, cellWAnchor, cellWDimension(1, 2), emptyCell, defaultCell),
            row(defaultCell, emptyCell, cellWHead, defaultCell)),

      mergeCellsCommand,

      table(row(defaultCell, cell({ [AttributeType.RowSpan]: 2, [AttributeType.ColSpan]: 3 }, p('x'), p('x'), p('x')), defaultCell),
            row(defaultCell, defaultCell))
    ));

  it('keeps the column width of the first column', () =>
    executeTableTestCommand(
      table(row(cell({ [AttributeType.ColWidth]: [100] }, p(`x<${ANCHOR}>`)), defaultCell),
            row(defaultCell, cellWHead)),

      mergeCellsCommand,

      table(
        row(
          cell(
            { [AttributeType.ColSpan]: 2, [AttributeType.RowSpan]: 2, [AttributeType.ColWidth]: [100, 0] },
            p('x'),
            p('x'),
            p('x'),
            p('x')
          )
        ),
        row()
      )
    ));
});

describe('splitCellCommand', () => {
  it('does nothing when cursor is inside of a Cell with attributes colSpan = 1 and rowSpan = 1', () =>
    executeTableTestCommand(
      table(row(cellWCursor, defaultCell)),

        splitCellCommand(),

        null/*expect to return false*/
    ));

  it('can split col-spanning Cell with cursor', () =>
    executeTableTestCommand(
      table(row(cell({ [AttributeType.ColSpan]: 2 }, p(`foo<${CURSOR}>`)), defaultCell)),

      splitCellCommand(),

      table(row(cell(p('foo')), emptyCell, defaultCell))
    ));

  it('can split when col-spanning HeaderCell with cursor', () =>
    executeTableTestCommand(
      table(row(hCell({ [AttributeType.ColSpan]: 2 }, p(`foo<${CURSOR}>`)))),

      splitCellCommand(),

      table(row(hCell(p('foo')), emptyHeaderCell))
    ));

  it('does nothing for a multi-CellSelection', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, cellWHead, defaultCell)),

        splitCellCommand(),

        null/*expect to return false*/
    ));

  it('does nothing when the selected Cell does not span anything', () =>
    executeTableTestCommand(
      table(row(cellWAnchor, defaultCell)),

        splitCellCommand(),

        null/*expect to return false*/
    ));

  it('can split a col-spanning Cell', () =>
    executeTableTestCommand(
      table(row(cell({ [AttributeType.ColSpan]: 2 }, p(`foo<${ANCHOR}>`)), defaultCell)),

      splitCellCommand(),

      table(row(cell(p('foo')), emptyCell, defaultCell))
    ));

  it('can split a row-spanning Cell', () =>
    executeTableTestCommand(
      table(row(defaultCell, cell({ [AttributeType.RowSpan]: 2 }, p(`foo<${ANCHOR}>`)), defaultCell),
            row(defaultCell, defaultCell)),

      splitCellCommand(),

      table(row(defaultCell, cell(p('foo')), defaultCell),
            row(defaultCell, emptyCell, defaultCell))
    ));

  it('can split a rectangular Cell', () =>
    executeTableTestCommand(
      table(row(cellWDimension(4, 1)),
            row(defaultCell, cell({ [AttributeType.RowSpan]: 2, [AttributeType.ColSpan]: 2 }, p(`foo<${ANCHOR}>`)), defaultCell),
            row(defaultCell, defaultCell)
      ),

      splitCellCommand(),

      table(row(cellWDimension(4, 1)),
            row(defaultCell, cell(p('foo')), emptyCell, defaultCell),
            row(defaultCell, emptyCell, emptyCell, defaultCell)
      )
    ));

  it('distributes column widths', () =>
    executeTableTestCommand(
      table(row(cell({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 0, 200] }, p(`a<${ANCHOR}>`)))),

      splitCellCommand(),

      table(row(cell({ [AttributeType.ColWidth]: [100] }, p('a')), emptyCell, cell({ [AttributeType.ColWidth]: [200] }, p())))
    ));

  describe('with custom Cell type', () => {
    const createGetCellTypeFunction = (state: EditorState): GetCellTypeFunctionType => (state, row, col, node) =>
      row === 0
        ? state.schema.nodes[NodeName.HEADER_CELL]
        :  state.schema.nodes[NodeName.CELL];

    const splitCellWithOnlyHeaderInColumnZero: Command = (state, dispatch) => splitCellCommand(createGetCellTypeFunction(state))(state, dispatch);
    it('can split a row-spanning header Cell into a header and normal Cell ', () =>
      executeTableTestCommand(
        table(row(defaultCell, cell({ [AttributeType.RowSpan]: 2 }, p(`foo<${ANCHOR}>`)), defaultCell),
              row(defaultCell, defaultCell)),

        splitCellWithOnlyHeaderInColumnZero,

        table(row(defaultCell, hCell(p('foo')), defaultCell),
              row(defaultCell, emptyCell, defaultCell))
      ));
  });
});

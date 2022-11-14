import { AttributeType } from '../../../../notebookEditor/attribute';
import { cellBuilder, cellWithAnchorBuilder, cellWithDimensionBuilder, cellWithHeadBuilder, defaultCellBuilder, defaultRowBuilder, defaultTableBuilder, executeTableTestCommand, tableParagraphBuilder } from '../../test/tableTestUtil';
// import { ANCHOR } from '../../test/testUtil';

import { mergeCellsCommand } from './cell';

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

  // it('can merge two Cells in a row', () =>
  //   executeTableTestCommand(
  //     defaultTableBuilder(
  //       defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
  //       defaultRowBuilder(cellWithHeadBuilder, cellBuilder)),

  //     mergeCellsCommand,

  //     defaultTableBuilder(
  //       defaultRowBuilder(defaultCellBuilder({ rowspan: 2 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
  //       defaultRowBuilder(cellBuilder))
  //   ));

  // it('can merge a rectangle of Cells', () =>
  //   executeTableTestCommand(
  //     defaultTableBuilder(
  //       defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, emptyCellBuilder, emptyCellBuilder, cellBuilder),
  //       defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder, cellWithHeadBuilder, cellBuilder)
  //     ),

  //     mergeCellsCommand,

  //     defaultTableBuilder(
  //       defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2, [AttributeType.ColSpan]: 3 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
  //       defaultRowBuilder(cellBuilder, cellBuilder)
  //     )
  //   ));

  // it('can merge already spanning Cells', () =>
  //   executeTableTestCommand(
  //     defaultTableBuilder(
  //       defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellWithDimensionBuilder(1, 2), emptyCellBuilder, cellBuilder),
  //       defaultRowBuilder(cellBuilder, emptyCellBuilder, cellWithHeadBuilder, cellBuilder)),

  //     mergeCellsCommand,

  //     defaultTableBuilder(
  //       defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2, [AttributeType.ColSpan]: 3 }, tableParagraphBuilder('x'), tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
  //       defaultRowBuilder(cellBuilder, cellBuilder))
  //   ));

  // it('keeps the column width of the first column', () =>
  //   executeTableTestCommand(
  //     defaultTableBuilder(
  //       defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColWidth]: [100] }, tableParagraphBuilder(`x<${ANCHOR}>`)), cellBuilder),
  //       defaultRowBuilder(cellBuilder, cellWithHeadBuilder)),

  //     mergeCellsCommand,

  //     defaultTableBuilder(
  //       defaultRowBuilder(
  //         defaultCellBuilder(
  //           { [AttributeType.ColSpan]: 2, [AttributeType.RowSpan]: 2, [AttributeType.ColWidth]: [100, 0] },
  //           tableParagraphBuilder('x'),
  //           tableParagraphBuilder('x'),
  //           tableParagraphBuilder('x'),
  //           tableParagraphBuilder('x')
  //         )
  //       ),
  //       defaultRowBuilder()
  //     )
  //   ));
});

// describe('splitCellCommand', () => {
//   it('does nothing when cursor is inside of a cell with attributes [AttributeType.ColSpan] = 1 and rowspan = 1', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellBuilder)), splitCellCommand, null));

//   it('can split when col-spanning cell with cursor', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${CURSOR}>`)), cellBuilder)),
//       splitCellCommand,
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder))
//     ));

//   it('can split when col-spanning header-cell with cursor', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultHeaderCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${CURSOR}>`)))),
//       splitCellCommand,
//       defaultTableBuilder(defaultRowBuilder(defaultHeaderCellBuilder(tableParagraphBuilder('foo')), emptyHeaderCellBuilder))
//     ));

//   it('does nothing for a multi-CellSelection', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellWithHeadBuilder, cellBuilder)), splitCellCommand, null));

//   it('does nothing when the selected cell does not span anything', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellBuilder)), splitCellCommand, null));

//   it('can split a col-spanning cell', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder)),
//       splitCellCommand,
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder))
//     ));

//   it('can split a row-spanning cell', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)),
//       splitCellCommand,
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, defaultCellBuilder(tableParagraphBuilder('foo')), cellBuilder), defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
//     ));

//   it('can split a rectangular cell', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(
//         defaultRowBuilder(cellWithDimensionBuilder(4, 1)),
//         defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2, [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder),
//         defaultRowBuilder(cellBuilder, cellBuilder)
//       ),
//       splitCellCommand,
//       defaultTableBuilder(
//         defaultRowBuilder(cellWithDimensionBuilder(4, 1)),
//         defaultRowBuilder(cellBuilder, defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder, cellBuilder)
//       )
//     ));

//   it('distributes column widths', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 0, 200] }, tableParagraphBuilder(`a<${ANCHOR}>`)))),
//       splitCellCommand,
//       defaultTableBuilder(
//         defaultRowBuilder(
//           defaultCellBuilder({ [AttributeType.ColWidth]: [100] }, tableParagraphBuilder('a')),
//           emptyCellBuilder,
//           defaultCellBuilder({ [AttributeType.ColWidth]: [200] }, tableParagraphBuilder())
//         )
//       )
//     ));

//   // describe('with custom cell type', () => {
//   //   function createGetCellType(state) {
//   //     return ({ row }) => {
//   //       if(row === 0) {
//   //         return state.schema.nodes.table_header;
//   //       }
//   //       return state.schema.nodes.table_cell;
//   //     };
//   //   }

//   //   const splitCellWithOnlyHeaderInColumnZero = (state, dispatch) =>
//   //     splitCellWithType(createGetCellType(state))(state, dispatch);

//   //   it('can split a row-spanning header cell into a header and normal cell ', () =>
//   //     executeTableTestCommand(
//   //       defaultTableBuilder(defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2 }, tableParagraphBuilder(`foo<${ANCHOR}>`)), cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)),
//   //       splitCellWithOnlyHeaderInColumnZero,
//   //       defaultTableBuilder(defaultRowBuilder(cellBuilder, defaultHeaderCellBuilder(tableParagraphBuilder('foo')), cellBuilder), defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
//   //     ));
//   // });
// });

// describe('setCellAttr', () => {
//   let cAttr = defaultCellBuilder({ executeTableTestCommand: 'value' }, tableParagraphBuilder('x'));

//   it('can set an attribute on a parent cell', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellBuilder)),
//       setCellAdefaultCellBuilderefaultRowBuilder('executeTableTestCommand', 'value'),
//       defaultTableBuilder(defaultRowBuilder(cAttr, cellBuilder))
//     ));

//   it('does nothing when the attribute is already there', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellBuilder)), setCellAdefaultCellBuilderefaultRowBuilder('executeTableTestCommand', 'default'), null));

//   it('will set attributes on all Cells covered by a CellSelection', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellWithHeadBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),
//       setCellAdefaultCellBuilderefaultRowBuilder('executeTableTestCommand', 'value'),
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, cAttr, cAttr), defaultRowBuilder(cellWithDimensionBuilder(2, 1), cAttr), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
//     ));
// });

import ist from 'ist';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Command, EditorState } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { NodeName } from '../../../../notebookEditor/node';
import { cellBuilder, cellWithAnchorBuilder, cellWithCursorBuilder, cellWithDimensionBuilder, cellWithHeadBuilder, defaultCellBuilder, defaultRowBuilder, defaultTableBuilder,  emptyCellBuilder, emptyHeaderCellBuilder, headerCellBuilder, headerCellWithCursorBuilder, selectionForTableTest, tableParagraphBuilder } from '../../test/tableTestUtil';
import { getNotebookSchemaNodeBuilders, CURSOR, NODE } from '../../test/testUtil';
import { addColumnAfterCommand, addColumnBeforeCommand, addRowAfterCommand, addRowBeforeCommand, deleteColumnCommand, deleteRowCommand } from './table';

// ********************************************************************************
// == Constant ====================================================================
const { [NodeName.DOC]: docBuilder } = getNotebookSchemaNodeBuilders([NodeName.DOC]);

// == Table =======================================================================
const executeTableTestCommand = (doc: ProseMirrorNode, command: Command, resultingDoc: ProseMirrorNode | null) => {
  let state = EditorState.create({ doc, selection: selectionForTableTest(doc) });
  const commandExecutedSuccessfully = command(state, (tr) => (state = state.apply(tr)));

  if(resultingDoc === null) { ist(commandExecutedSuccessfully, false); }
  else { ist(state.doc, resultingDoc, eq); }
};

// -- Column ----------------------------------------------------------------------
describe('addColumnAfterCommand', () => {
  it('can add a plain column', () =>
    executeTableTestCommand(

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),

        addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder, cellBuilder)
      )
    ));

  it('can add a column at the right of the Table', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellWithCursorBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder, emptyCellBuilder)
      )
    ));

  it('can add a second Cell', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder)),

        addColumnAfterCommand,

        defaultTableBuilder(defaultRowBuilder(cellBuilder, emptyCellBuilder))
    ));

  it('can grow a ColSpan Cell', () =>
    executeTableTestCommand(
      defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1))),

      addColumnAfterCommand,

      defaultTableBuilder(defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder), defaultRowBuilder(cellWithDimensionBuilder(3, 1)))
    ));

  it('places new Cells in the right spot when there are rowSpans', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 2), cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder, cellBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 2), emptyCellBuilder, cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder, cellBuilder))
    ));

  it('can place new Cells into an empty row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(1, 2), cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(),
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(1, 2), emptyCellBuilder, cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(emptyCellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
    ));

  it('will skip ahead when growing a rowSpan Cell', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(2, 2), cellBuilder),
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder, cellBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(3, 2), cellBuilder),
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellWithCursorBuilder, emptyCellBuilder, cellBuilder, cellBuilder))
    ));

  it('will use the right side of a single CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
    ));

  it('will use the right side of a bigger CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithHeadBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder, cellBuilder))
    ));

  it('properly handles a Cell NodeSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(`<${NODE}>`, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
    ));

  it('preserves HeaderCell rows', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellBuilder),
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellBuilder, emptyHeaderCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder))
    ));

  it('uses column after as reference when header column before is present', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellBuilder),
        defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, emptyHeaderCellBuilder, headerCellBuilder),
        defaultRowBuilder(headerCellBuilder, emptyCellBuilder, cellBuilder))
    ));

  it('creates regular cells when only next to a header column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, headerCellBuilder),
        defaultRowBuilder(cellBuilder, headerCellWithCursorBuilder)),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, headerCellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, headerCellBuilder, emptyCellBuilder))
    ));

  it('does nothing outside of a Table', () =>
    executeTableTestCommand(docBuilder(tableParagraphBuilder(`foo<${CURSOR}>`)), addColumnAfterCommand, null/*expect to return false*/));

  it('preserves column widths', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2, [AttributeType.ColWidth]: [100, 200] }, tableParagraphBuilder('a')))
      ),

      addColumnAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 0, 200] }, tableParagraphBuilder('a')))
      )
    ));
});

describe('addColumnBeforeCommand', () => {
  it('can add a plain column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),

      addColumnBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder, cellBuilder)
      )
    ));

  it('can add a column at the left of the Table', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),

      addColumnBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder, cellBuilder)
      )
    ));

  it('will use the left side of a single CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      addColumnBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder))
    ));

  it('will use the left side of a bigger CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithHeadBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellWithAnchorBuilder)),

      addColumnBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder, cellBuilder))
    ));

  it('preserves header rows', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellBuilder),
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder)),

      addColumnBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyHeaderCellBuilder, headerCellBuilder, headerCellBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder))
    ));
});

describe('deleteColumnCommand', () => {
  it('can delete a plain column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, emptyCellBuilder)),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder))
    ));

  it('can delete the first column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('can delete the last column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder, cellWithCursorBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('can reduce a Cell ColSpan', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder),
        defaultRowBuilder(cellWithDimensionBuilder(2, 1))),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellBuilder))
    ));

  it('will skip rows after a rowSpan', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder),
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(cellBuilder)),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellBuilder))
    ));

  it('will delete all columns under a colSpan Cell', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`<${CURSOR}>`))),
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder)),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(emptyCellBuilder))
    ));

  it('deletes a Cell selected column', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellWithAnchorBuilder),
        defaultRowBuilder(cellBuilder, cellWithHeadBuilder)),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder),
        defaultRowBuilder(cellBuilder))
    ));

  it('deletes multiple Cell selected columns', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(1, 2), cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellWithHeadBuilder, cellBuilder, cellBuilder)),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(emptyCellBuilder),
        defaultRowBuilder(cellBuilder))
    ));

  it('leaves column widths intact', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 200, 300] }, tableParagraphBuilder('y')))),

      deleteColumnCommand,

      defaultTableBuilder(defaultRowBuilder(cellBuilder, cellBuilder), defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2, [AttributeType.ColWidth]: [100, 300] }, tableParagraphBuilder('y'))))
    ));

  it('resets column width when all zeroes', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [0, 200, 0] }, tableParagraphBuilder('y')))),

      deleteColumnCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder('y'))))
    ));
});

// -- Row -------------------------------------------------------------------------
describe('addRowAfterCommand', () => {
  it('can add a simple row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(emptyCellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('can add a row at the end', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder)),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(emptyCellBuilder, emptyCellBuilder))
    ));

  it('increases rowspan when needed', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(cellBuilder)),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 3)),
        defaultRowBuilder(emptyCellBuilder),
        defaultRowBuilder(cellBuilder))
    ));

  it('skips columns for colSpan Cells', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, cellWithDimensionBuilder(2, 2)),
        defaultRowBuilder(cellBuilder)),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(2, 3)),
        defaultRowBuilder(emptyCellBuilder), defaultRowBuilder(cellBuilder))
    ));

  it('picks the row after a CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithHeadBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(cellWithDimensionBuilder(3, 1))),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(emptyCellBuilder, emptyCellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellWithDimensionBuilder(3, 1))
      )
    ));

  it('preserves header columns', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, headerCellWithCursorBuilder),
        defaultRowBuilder(cellBuilder, headerCellBuilder)),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, headerCellBuilder),
        defaultRowBuilder(emptyCellBuilder, emptyHeaderCellBuilder),
        defaultRowBuilder(cellBuilder, headerCellBuilder))
    ));

  it('uses next row as reference when row before is a header', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellWithCursorBuilder),
        defaultRowBuilder(cellBuilder, headerCellBuilder)),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellBuilder),
        defaultRowBuilder(emptyCellBuilder, emptyHeaderCellBuilder),
        defaultRowBuilder(cellBuilder, headerCellBuilder))
    ));

  it('creates regular Cells when no reference row is available', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellWithCursorBuilder)),

      addRowAfterCommand,

      defaultTableBuilder(
        defaultRowBuilder(headerCellBuilder, headerCellBuilder),
        defaultRowBuilder(emptyCellBuilder, emptyCellBuilder))
    ));
});

describe('addRowBeforeCommand', () => {
  it('can add a simple row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder)),

      addRowBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(emptyCellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('can add a row at the start', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      addRowBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('picks the row before a CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(2, 1)),
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithHeadBuilder, cellBuilder)),

      addRowBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(2, 1)),
        defaultRowBuilder(emptyCellBuilder, emptyCellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)
      )
    ));

  it('preserves header columns', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder),
        defaultRowBuilder(headerCellBuilder, cellBuilder)),

      addRowBeforeCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyHeaderCellBuilder, emptyCellBuilder),
        defaultRowBuilder(headerCellBuilder, cellBuilder),
        defaultRowBuilder(headerCellBuilder, cellBuilder))
    ));
});

describe('deleteRowCommand', () => {
  it('can delete a simple row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellWithCursorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder))
    ));

  it('can delete the first row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder))
    ));

  it('can delete the last row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellWithCursorBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder))
    ));

  it('can shrink rowspan cells', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(1, 2), cellBuilder, cellWithDimensionBuilder(1, 3)),
        defaultRowBuilder(cellWithCursorBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('can move cells that start in the deleted row', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithDimensionBuilder(1, 2), cellWithCursorBuilder),
        defaultRowBuilder(emptyCellBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder))
    ));

  it('deletes multiple rows when the start cell has a rowSpan', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.RowSpan]: 3 }, tableParagraphBuilder(`<${CURSOR}>`)), cellBuilder),
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)
      ),

      deleteRowCommand,

      defaultTableBuilder(defaultRowBuilder(cellBuilder, cellBuilder))
    ));

  it('skips columns when adjusting rowSpan', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithCursorBuilder, cellWithDimensionBuilder(2, 2)),
        defaultRowBuilder(cellBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(2, 1)))
    ));

  it('can delete a CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder))
    ));

  it('will delete all rows in the CellSelection', () =>
    executeTableTestCommand(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellWithHeadBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder)),

      deleteRowCommand,

      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder))
    ));
});

// -- Cell ------------------------------------------------------------------------
// describe('mergeCells', () => {
//   it('doesn't do anything when only one cell is selected', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellBuilder)), mergeCells, null));

//   it('doesn't do anything when the selection cuts across spanning cells', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellWithDimensionBuilder(2, 1)), defaultRowBuilder(cellBuilder, cellWithHeadBuilder, cellBuilder)), mergeCells, null));

//   it('can merge two cells in a column', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellWithHeadBuilder, cellBuilder)),
//       mergeCells,
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder))
//     ));

//   it('can merge two cells in a row', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellBuilder), defaultRowBuilder(cellWithHeadBuilder, cellBuilder)),
//       mergeCells,
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ rowspan: 2 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder), defaultRowBuilder(cellBuilder))
//     ));

//   it('can merge a rectangle of cells', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, emptyCellBuilder, emptyCellBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder, cellWithHeadBuilder, cellBuilder)
//       ),
//       mergeCells,
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2, [AttributeType.ColSpan]: 3 }, tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
//         defaultRowBuilder(cellBuilder, cellBuilder)
//       )
//     ));

//   it('can merge already spanning cells', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellWithDimensionBuilder(1, 2), emptyCellBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, cellWithHeadBuilder, cellBuilder)
//       ),
//       mergeCells,
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2, [AttributeType.ColSpan]: 3 }, tableParagraphBuilder('x'), tableParagraphBuilder('x'), tableParagraphBuilder('x')), cellBuilder),
//         defaultRowBuilder(cellBuilder, cellBuilder)
//       )
//     ));

//   it('keeps the column width of the first col', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColWidth]: [100] }, tableParagraphBuilder('x<anchor>')), cellBuilder), defaultRowBuilder(cellBuilder, cellWithHeadBuilder)),
//       mergeCells,
//       defaultTableBuilder(
//         defaultRowBuilder(
//           defaultCellBuilder(
//             { [AttributeType.ColSpan]: 2, rowspan: 2, [AttributeType.ColWidth]: [100, 0] },
//             tableParagraphBuilder('x'),
//             tableParagraphBuilder('x'),
//             tableParagraphBuilder('x'),
//             tableParagraphBuilder('x')
//           )
//         ),
//         defaultRowBuilder()
//       )
//     ));
// });

// describe('splitCell', () => {
//   it('does nothing when cursor is inside of a cell with attributes [AttributeType.ColSpan] = 1 and rowspan = 1', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellBuilder)), splitCell, null));

//   it('can split when col-spanning cell with cursor', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${CURSOR}>`)), cellBuilder)),
//       splitCell,
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder))
//     ));

//   it('can split when col-spanning header-cell with cursor', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(th({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder(`foo<${CURSOR}>`)))),
//       splitCell,
//       defaultTableBuilder(defaultRowBuilder(th(tableParagraphBuilder('foo')), emptyHeaderCellBuilder))
//     ));

//   it('does nothing for a multi-CellSelection', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellWithHeadBuilder, cellBuilder)), splitCell, null));

//   it('does nothing when the selected cell doesn't span anything', () =>
//     executeTableTestCommand(defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellBuilder)), splitCell, null));

//   it('can split a col-spanning cell', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, tableParagraphBuilder('foo<anchor>')), cellBuilder)),
//       splitCell,
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder))
//     ));

//   it('can split a row-spanning cell', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2 }, tableParagraphBuilder('foo<anchor>')), cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)),
//       splitCell,
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, defaultCellBuilder(tableParagraphBuilder('foo')), cellBuilder), defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
//     ));

//   it('can split a rectangular cell', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(
//         defaultRowBuilder(cellWithDimensionBuilder(4, 1)),
//         defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2, [AttributeType.ColSpan]: 2 }, tableParagraphBuilder('foo<anchor>')), cellBuilder),
//         defaultRowBuilder(cellBuilder, cellBuilder)
//       ),
//       splitCell,
//       defaultTableBuilder(
//         defaultRowBuilder(cellWithDimensionBuilder(4, 1)),
//         defaultRowBuilder(cellBuilder, defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder, cellBuilder)
//       )
//     ));

//   it('distributes column widths', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 0, 200] }, tableParagraphBuilder('a<anchor>')))),
//       splitCell,
//       defaultTableBuilder(
//         defaultRowBuilder(
//           defaultCellBuilder({ [AttributeType.ColWidth]: [100] }, tableParagraphBuilder('a')),
//           emptyCellBuilder,
//           defaultCellBuilder({ [AttributeType.ColWidth]: [200] }, tableParagraphBuilder())
//         )
//       )
//     ));

//   describe('with custom cell type', () => {
//     function createGetCellType(state) {
//       return ({ row }) => {
//         if(row === 0) {
//           return state.schema.nodes.table_header;
//         }
//         return state.schema.nodes.table_cell;
//       };
//     }

//     const splitCellWithOnlyHeaderInColumnZero = (state, dispatch) =>
//       splitCellWithType(createGetCellType(state))(state, dispatch);

//     it('can split a row-spanning header cell into a header and normal cell ', () =>
//       executeTableTestCommand(
//         defaultTableBuilder(defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2 }, tableParagraphBuilder('foo<anchor>')), cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)),
//         splitCellWithOnlyHeaderInColumnZero,
//         defaultTableBuilder(defaultRowBuilder(cellBuilder, th(tableParagraphBuilder('foo')), cellBuilder), defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder))
//       ));
//   });
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

//   it('will set attributes on all cells covered by a CellSelection', () =>
//     executeTableTestCommand(
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellWithHeadBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),
//       setCellAdefaultCellBuilderefaultRowBuilder('executeTableTestCommand', 'value'),
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, cAttr, cAttr), defaultRowBuilder(cellWithDimensionBuilder(2, 1), cAttr), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
//     ));
// });

// // -- Header Cell -----------------------------------------------------------------
// describe('toggleHeaderRow', () => {
//   it('turns a non-header row into header', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder))),
//       toggleHeaderRow,
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellBuilder, headerCellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)))
//     ));

//   it('turns a header row into regular cells', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder), defaultRowBuilder(cellBuilder, cellBuilder))),
//       toggleHeaderRow,
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)))
//     ));

//   it('turns a partial header row into regular cells', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, headerCellBuilder), defaultRowBuilder(cellBuilder, cellBuilder))),
//       toggleHeaderRow,
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)))
//     ));

//   it('leaves cell spans intact', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellWithDimensionBuilder(2, 2)), defaultRowBuilder(cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))),
//       toggleHeaderRow,
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellBuilder, h(2, 2)), defaultRowBuilder(cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)))
//     ));
// });

// describe('toggleHeaderColumn', () => {
//   it('turns a non-header column into header', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellWithCursorBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder))),
//       toggleHeaderColumn,
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellBuilder, cellBuilder), defaultRowBuilder(headerCellBuilder, cellBuilder)))
//     ));

//   it('turns a header column into regular cells', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder), defaultRowBuilder(headerCellBuilder, cellBuilder))),
//       toggleHeaderColumn,
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellBuilder, headerCellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)))
//     ));

//   it('turns a partial header column into regular cells', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder))),
//       toggleHeaderColumn,
//       docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(cellBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)))
//     ));
// });

// describe('toggleHeader', () => {
//   it('turns a header row with [AttributeType.ColSpan] and rowspan into a regular cell', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(
//         tableParagraphBuilder('x'),
//         defaultTableBuilder(defaultRowBuilder(h(2, 1), h(1, 2)), defaultRowBuilder(cellWithCursorBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
//       ),
//       toggleHeader('row', { useDeprecateLogic: false }),
//       docellWithDimensionBuilder(
//         tableParagraphBuilder('x'),
//         defaultTableBuilder(defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellWithDimensionBuilder(1, 2)), defaultRowBuilder(cellWithCursorBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
//       )
//     ));

//   it('turns a header column with [AttributeType.ColSpan] and rowspan into a regular cell', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(
//         tableParagraphBuilder('x'),
//         defaultTableBuilder(defaultRowBuilder(h(2, 1), h(1, 2)), defaultRowBuilder(cellWithCursorBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder))
//       ),
//       toggleHeader('column', { useDeprecateLogic: false }),
//       docellWithDimensionBuilder(tableParagraphBuilder('x'), defaultTableBuilder(defaultRowBuilder(h(2, 1), h(1, 2)), defaultRowBuilder(headerCellBuilder, cellBuilder), defaultRowBuilder(headerCellBuilder, cellBuilder, cellBuilder)))
//     ));

//   it('should keep first cell as header when the column header is enabled', () =>
//     executeTableTestCommand(
//       docellWithDimensionBuilder(tableParagraphBuilder('x'), defaultTableBuilder(defaultRowBuilder(headerCellBuilder, cellBuilder), defaultRowBuilder(headerCellWithCursorBuilder, cellBuilder), defaultRowBuilder(headerCellBuilder, cellBuilder))),
//       toggleHeader('row', { useDeprecateLogic: false }),
//       docellWithDimensionBuilder(tableParagraphBuilder('x'), defaultTableBuilder(defaultRowBuilder(headerCellBuilder, headerCellBuilder), defaultRowBuilder(headerCellBuilder, cellBuilder), defaultRowBuilder(headerCellBuilder, cellBuilder)))
//     ));

//   describe('new behavior', () => {
//     it('turns a header column into regular cells without override header row', () =>
//       executeTableTestCommand(
//         docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder), defaultRowBuilder(headerCellBuilder, cellBuilder))),
//         toggleHeader('column', { useDeprecateLogic: false }),
//         docellWithDimensionBuilder(defaultTableBuilder(defaultRowBuilder(headerCellWithCursorBuilder, headerCellBuilder), defaultRowBuilder(cellBuilder, cellBuilder)))
//       ));
//   });
// });

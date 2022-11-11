import ist from 'ist';
// import { Slice } from 'prosemirror-model';
import { Command, EditorState } from 'prosemirror-state';
// import { eq } from 'prosemirror-test-builder';

import { emptyCellBuilder, isCellSelection, getNotebookSchemaNodeBuilders, CellSelection, NodeName } from 'common';

import { addRowBefore, addRowAfter } from '../node';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.DOC]: docBuilder,
  [NodeName.ROW]: rowBuilder,
  [NodeName.TABLE]: tableBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.ROW, NodeName.TABLE]);

// == Test ========================================================================
describe('CellSelection', () => {
  // NOTE: the inline comments below are the positions of the
  // .     start of the Cell Nodes
  const tableDoc = docBuilder(
    tableBuilder(
      rowBuilder(/* 2*/ emptyCellBuilder, /* 6*/ emptyCellBuilder, /*10*/ emptyCellBuilder),
      rowBuilder(/*16*/ emptyCellBuilder, /*20*/ emptyCellBuilder, /*24*/ emptyCellBuilder),
      rowBuilder(/*30*/ emptyCellBuilder, /*34*/ emptyCellBuilder, /*36*/ emptyCellBuilder)
    )
  );

  const executeCellSelectionTestCommand = (anchor: number, head: number, command: Command) => {
    let state = EditorState.create({ doc: tableDoc, selection: CellSelection.create(tableDoc, anchor, head) });
    command(state, (tr) => (state = state.apply(tr)));
    return state;
  };

  it('will put its head/anchor around the head cell', () => {
    let selection = CellSelection.create(tableDoc, 2, 24);
    ist(selection.anchor, 25);
    ist(selection.head, 27);

    selection = CellSelection.create(tableDoc, 24, 2);
    ist(selection.anchor, 3);
    ist(selection.head, 5);

    selection = CellSelection.create(tableDoc, 10, 30);
    ist(selection.anchor, 31);
    ist(selection.head, 33);

    selection = CellSelection.create(tableDoc, 30, 10);
    ist(selection.anchor, 11);
    ist(selection.head, 13);
  });

  it('extends a row selection when adding a row', () => {
    let selection = executeCellSelectionTestCommand(34, 6, addRowBefore).selection;
    if(!isCellSelection(selection)) throw new Error('Expected CellSelection');
    ist(selection.$anchorCell.pos, 48);
    ist(selection.$headCell.pos, 6);

    selection = executeCellSelectionTestCommand(6, 30, addRowAfter).selection;
    if(!isCellSelection(selection)) throw new Error('Expected CellSelection');
    ist(selection.$anchorCell.pos, 6);
    ist(selection.$headCell.pos, 44);
  });

//   it('extends a col selection when adding a column', () => {
//     let sel = executeCommand(16, 24, addColumnAfter).selection;
//     ist(sel.$anchorCell.pos, 20);
//     ist(sel.$headCell.pos, 32);
//     sel = executeCommand(24, 30, addColumnBefore).selection;
//     ist(sel.$anchorCell.pos, 32);
//     ist(sel.$headCell.pos, 38);
//   });
// });

// describe('CellSelection.content', () => {
//   function slice(doc) {
//     return new Slice(doc.content, 1, 1);
//   }

//   it('contains only the selected cells', () =>
//     ist(
//       selectionForTableTest(
//         tableBuilder(
//           rowBuilder(c11, cAnchor, emptyCellBuilder),
//           rowBuilder(c11, emptyCellBuilder, cHead),
//           rowBuilder(c11, c11, c11)
//         )
//       ).content(),
//       slice(tableBuilder('<a>', rowBuilder(c11, emptyCellBuilder), rowBuilder(emptyCellBuilder, c11))),
//       eq
//     ));

//   it('understands spanning cells', () =>
//     ist(
//       selectionForTableTest(
//         tableBuilder(rowBuilder(cAnchor, c(2, 2), c11, c11), rowBuilder(c11, cHead, c11, c11))
//       ).content(),
//       slice(tableBuilder(rowBuilder(c11, c(2, 2), c11), rowBuilder(c11, c11))),
//       eq
//     ));

//   it('cuts off cells sticking out horizontally', () =>
//     ist(
//       selectionForTableTest(
//         tableBuilder(rowBuilder(c11, cAnchor, c(2, 1)), rowBuilder(c(4, 1)), rowBuilder(c(2, 1), cHead, c11))
//       ).content(),
//       slice(tableBuilder(rowBuilder(c11, c11), rowBuilder(td({ colspan: 2 }, p())), rowBuilder(emptyCellBuilder, c11))),
//       eq
//     ));

//   it('cuts off cells sticking out vertically', () =>
//     ist(
//       selectionForTableTest(
//         tableBuilder(
//           rowBuilder(c11, c(1, 4), c(1, 2)),
//           rowBuilder(cAnchor),
//           rowBuilder(c(1, 2), cHead),
//           rowBuilder(c11)
//         )
//       ).content(),
//       slice(tableBuilder(rowBuilder(c11, td({ rowspan: 2 }, p()), emptyCellBuilder), rowBuilder(c11, c11))),
//       eq
//     ));

//   it('preserves column widths', () =>
//     ist(
//       selectionForTableTest(
//         tableBuilder(
//           rowBuilder(c11, cAnchor, c11),
//           rowBuilder(td({ colspan: 3, colwidth: [100, 200, 300] }, p('x'))),
//           rowBuilder(c11, cHead, c11)
//         )
//       ).content(),
//       slice(tableBuilder(rowBuilder(c11), rowBuilder(td({ colwidth: [200] }, p())), rowBuilder(c11))),
//       eq
//     ));
// });

// describe('normalizeSelection', () => {
//   let t = docBuilder(
//     tableBuilder(
//       rowBuilder(/* 2*/ c11, /* 7*/ c11, /*12*/ c11),
//       rowBuilder(/*19*/ c11, /*24*/ c11, /*29*/ c11),
//       rowBuilder(/*36*/ c11, /*41*/ c11, /*46*/ c11)
//     )
//   );

//   function normalize(selection, { allowTableNodeSelection = false } = {}) {
//     let state = EditorState.create({
//       doc: t,
//       selection,
//       plugins: [tableEditing({ allowTableNodeSelection })],
//     });
//     return state.apply(state.tr).selection;
//   }

//   it('converts a table node selection into a selection of all cells in the table', () => {
//     ist(
//       normalize(NodeSelection.create(t, 0)),
//       CellSelection.create(t, 2, 46),
//       eq
//     );
//   });

//   it('retains a table node selection if the allowTableNodeSelection option is true', () => {
//     ist(
//       normalize(NodeSelection.create(t, 0), { allowTableNodeSelection: true }),
//       NodeSelection.create(t, 0),
//       eq
//     );
//   });

//   it('converts a row node selection into a cell selection', () => {
//     ist(
//       normalize(NodeSelection.create(t, 1)),
//       CellSelection.create(t, 2, 12),
//       eq
//     );
//   });

//   it('converts a cell node selection into a cell selection', () => {
//     ist(
//       normalize(NodeSelection.create(t, 2)),
//       CellSelection.create(t, 2, 2),
//       eq
//     );
//   });
});

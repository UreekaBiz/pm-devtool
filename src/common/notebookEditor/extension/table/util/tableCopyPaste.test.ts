import ist from 'ist';
import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';
import { eq } from 'prosemirror-test-builder';

import { cellBuilder, cellWithDimensionBuilder, defaultCellBuilder, defaultRowBuilder, defaultTableBuilder, emptyCellBuilder, tableDocBuilder, tableParagraphBuilder } from '../../../command/test/tableTestUtil';
import { A, B, ProseMirrorNodeWithTag, validateNodeWithTag } from '../../../command/test/testUtil';

import { clipCells, pastedCells, PastedCellsReturnType } from './tableCopyPaste';

describe('pastedCells', () => {
  const executePastedCellsTest = (sliceNode: ProseMirrorNodeWithTag, width: number | null, height?: number, content?: ProseMirrorNode[][]) => {
    const { [A]: sliceFromPos, [B]: sliceToPos } = sliceNode.tag;
    if(sliceFromPos === null/*explicit check since it can be 0*/ || sliceToPos === null/*explicit check since it can be 0*/) throw new Error('expected A and B positions to be defined for the test and they are not');

    const result: PastedCellsReturnType = pastedCells(sliceNode.slice(sliceFromPos, sliceToPos));
    if(!width) {
      return ist(result, null/*the outer Nodes of the Slice are not Tables or Rows*/);
    } /* else -- expect a different width */

    if(!result) throw new Error('expected pastedCells to produce a non-null result');
    ist(result.rows.length, result.height);
    ist(result.width, width);
    ist(result.height, height);

    if(content) {
      result.rows.forEach((row, i) => ist(row, Fragment.from(content[i]), eq));
    } /* else -- no content to look through */
  };

  it('returns simple Cells', () => {
    const startState = defaultTableBuilder(defaultRowBuilder(`<${A}>`, emptyCellBuilder, emptyCellBuilder, `<${B}>`));
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCellBuilder, emptyCellBuilder],
    ];

    executePastedCellsTest(startState, 2/*width*/, 1/*height*/, rowsContent);
  });

  it('returns Cells wrapped in a row', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(emptyCellBuilder, emptyCellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCellBuilder, emptyCellBuilder],
    ];

    executePastedCellsTest(startState, 2/*width*/, 1/*height*/, rowsContent);
  });

  it('returns Cells when the cursor is inside them', () => {
    const startState = defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder(`<${A}>foo`)), defaultCellBuilder(tableParagraphBuilder(`<${B}>bar`))));
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder],
    ];

    executePastedCellsTest(startState, 2/*width*/, 1/*height*/, rowsContent);
  });

  it('returns multiple rows', () => {
    const startState = defaultTableBuilder(defaultRowBuilder(`<${A}>`, emptyCellBuilder, emptyCellBuilder), defaultRowBuilder(emptyCellBuilder, cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCellBuilder, emptyCellBuilder],
      [emptyCellBuilder, cellBuilder],
    ];

    executePastedCellsTest(startState, 2/*width*/, 2/*height*/, rowsContent);
  });

  it('will enter a fully selected table', () => {
    const startState = tableDocBuilder(`<${A}>`, defaultTableBuilder(defaultRowBuilder(cellBuilder)), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellBuilder],
    ];

    executePastedCellsTest(startState, 1/*width*/, 1/*height*/, rowsContent);
  });

  it('can normalize a partially-selected row', () => {
    const startState = defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder(), `<${A}>`), emptyCellBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCellBuilder, cellBuilder],
      [cellBuilder, cellBuilder],
    ];

    executePastedCellsTest(startState, 2/*width*/, 2/*height*/, rowsContent);
  });

  it('will make sure the result is rectangular', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(cellWithDimensionBuilder(2, 2), cellBuilder), defaultRowBuilder(), defaultRowBuilder(cellBuilder, cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWithDimensionBuilder(2, 2), cellBuilder],
      [emptyCellBuilder],
      [cellBuilder, cellBuilder, emptyCellBuilder],
    ];

    executePastedCellsTest(startState, 3/*width*/, 3/*height*/, rowsContent);
  });

  it('can handle rowspans sticking out', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(cellWithDimensionBuilder(1, 3), cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWithDimensionBuilder(1, 3), cellBuilder],
      [emptyCellBuilder],
      [emptyCellBuilder],
    ];

    executePastedCellsTest(startState, 2/*width*/, 3/*height*/, rowsContent);
  });

  it('returns null for non-cell selection', () => {
    const startState = tableDocBuilder(tableParagraphBuilder(`foo<${A}>bar`), tableParagraphBuilder(`baz<${B}>`));
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    executePastedCellsTest(startState, null/*no width*/);
  });

});

describe('clipCells', () => {
  const executeClipCellsTest = (sliceNode: ProseMirrorNodeWithTag, width: number, height: number, content: ProseMirrorNode[][]) => {
    const { [A]: sliceFromPos, [B]: sliceToPos } = sliceNode.tag;
    if(sliceFromPos === null/*explicit check since it can be 0*/ || sliceToPos === null/*explicit check since it can be 0*/) throw new Error('expected A and B positions to be defined for the test and they are not');

    const pastedResult = pastedCells(sliceNode.slice(sliceFromPos, sliceToPos));
    if(!pastedResult) throw new Error('expected pastedResult to be valid');

    const result = clipCells(pastedResult, width, height);

    ist(result.rows.length, result.height);
    ist(result.width, width);
    ist(result.height, height);

    if(content) {
      result.rows.forEach((row, i) => ist(row, Fragment.from(content[i]), eq));
    } /* else -- no content to look through */
  };

  it('can clip off excess Cells', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(emptyCellBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCellBuilder],
    ];

    executeClipCellsTest(startState, 1/*width*/, 1/*height*/, rowsContent);
  });

  it('will pad by repeating Cells', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(emptyCellBuilder, cellBuilder), defaultRowBuilder(cellBuilder, emptyCellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCellBuilder, cellBuilder, emptyCellBuilder, cellBuilder],
      [cellBuilder, emptyCellBuilder, cellBuilder, emptyCellBuilder],
      [emptyCellBuilder, cellBuilder, emptyCellBuilder, cellBuilder],
      [cellBuilder, emptyCellBuilder, cellBuilder, emptyCellBuilder],
    ];

    executeClipCellsTest(startState, 4/*width*/, 4/*height*/, rowsContent);
  });

  it('takes rowspan into account when counting width', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(cellWithDimensionBuilder(2, 2), cellBuilder), defaultRowBuilder(cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWithDimensionBuilder(2, 2), cellBuilder, cellWithDimensionBuilder(2, 2), cellBuilder],
      [cellBuilder, cellBuilder],
    ];

    executeClipCellsTest(startState, 6/*width*/, 2/*height*/, rowsContent);
  });

  it('clips off excess colspan', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(cellWithDimensionBuilder(2, 2), cellBuilder), defaultRowBuilder(cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWithDimensionBuilder(2, 2), cellBuilder, cellWithDimensionBuilder(1, 2)],
      [cellBuilder],
    ];

    executeClipCellsTest(startState, 4/*width*/, 2/*height*/, rowsContent);
  });

  it('clips off excess rowspan', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(cellWithDimensionBuilder(2, 2), cellBuilder), defaultRowBuilder(cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWithDimensionBuilder(2, 2)],
      [],
      [cellWithDimensionBuilder(2, 1)],
    ];

    executeClipCellsTest(startState, 2/*width*/, 3/*height*/, rowsContent);
  });

  it('clips off excess rowspan when new table height is bigger than the current table height', () => {
    const startState = defaultTableBuilder(`<${A}>`, defaultRowBuilder(cellWithDimensionBuilder(1, 2), cellWithDimensionBuilder(2, 1)), defaultRowBuilder(cellBuilder, cellBuilder), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWithDimensionBuilder(1, 1), cellWithDimensionBuilder(2, 1)],
    ];

    executeClipCellsTest(startState, 3/*width*/, 1/*height*/, rowsContent);
  });

});

// describe('insertCells', () => {
//   function test(table, Cells, result) {
//     let state = EditorState.create({ doc: table });
//     let $cell = cellAround(table.resolve(table.tag.anchor)),
//       map = TableMap.get(table);
//     insertCells(
//       state,
//       (tr) => (state = state.apply(tr)),
//       0,
//       map.findCell($cell.pos),
//       pastedCells(Cells.slice(Cells.tag.a, Cells.tag.b))
//     );
//     ist(state.doc, result, eq);
//   }

//   it('keeps the original Cells', () =>
//     test(
//       defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder, cellBuilder, cellBuilder), defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)),
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder(`<${A}>foo`)), emptyCellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1), `<${B}>`)),
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder, cellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellBuilder))
//     ));

//   it('makes sure the table is big enough', () =>
//     test(
//       defaultTableBuilder(defaultRowBuilder(cellWithAnchorBuilder)),
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder(`<${A}>foo`)), emptyCellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1), `<${B}>`)),
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1)))
//     ));

//   it('preserves headers while growing a table', () =>
//     test(
//       defaultTableBuilder(defaultRowBuilder(h11, h11, h11), defaultRowBuilder(h11, cellBuilder, cellBuilder), defaultRowBuilder(h11, cellBuilder, cellWithAnchorBuilder)),
//       defaultTableBuilder(defaultRowBuilder(defaultCellBuilder(tableParagraphBuilder(`<${A}>foo`)), emptyCellBuilder), defaultRowBuilder(cellBuilder, cellBuilder, `<${B}>`)),
//       defaultTableBuilder(
//         defaultRowBuilder(h11, h11, h11, hEmpty),
//         defaultRowBuilder(h11, cellBuilder, cellBuilder, emptyCellBuilder),
//         defaultRowBuilder(h11, cellBuilder, defaultCellBuilder(tableParagraphBuilder('foo')), emptyCellBuilder),
//         defaultRowBuilder(hEmpty, emptyCellBuilder, cellBuilder, cellBuilder)
//       )
//     ));

//   it('will split interfering rowspan Cells', () =>
//     test(
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 4), cellBuilder),
//         defaultRowBuilder(cellWithAnchorBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, cellBuilder)
//       ),
//       defaultTableBuilder(defaultRowBuilder(`<${A}>`, emptyCellBuilder, emptyCellBuilder, emptyCellBuilder, `<${B}>`)),
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder),
//         defaultRowBuilder(emptyCellBuilder, emptyCellBuilder, emptyCellBuilder),
//         defaultRowBuilder(cellBuilder, defaultCellBuilder({ rowspan: 2 }, tableParagraphBuilder()), cellBuilder),
//         defaultRowBuilder(cellBuilder, cellBuilder)
//       )
//     ));

//   it('will split interfering colspan Cells', () =>
//     test(
//       defaultTableBuilder(defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder), defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellBuilder), defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(2, 1))),
//       defaultTableBuilder(`<${A}>`, defaultRowBuilder(emptyCellBuilder), defaultRowBuilder(emptyCellBuilder), defaultRowBuilder(emptyCellBuilder), `<${B}>`),
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder),
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder)
//       )
//     ));

//   it('preserves widths when splitting', () =>
//     test(
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder),
//         defaultRowBuilder(defaultCellBuilder({ colspan: 3, colwidth: [100, 200, 300] }, tableParagraphBuilder('x')))
//       ),
//       defaultTableBuilder(`<${A}>`, defaultRowBuilder(emptyCellBuilder), defaultRowBuilder(emptyCellBuilder), `<${B}>`),
//       defaultTableBuilder(
//         defaultRowBuilder(cellBuilder, emptyCellBuilder, cellBuilder),
//         defaultRowBuilder(
//           defaultCellBuilder({ colwidth: [100] }, tableParagraphBuilder('x')),
//           emptyCellBuilder,
//           defaultCellBuilder({ colwidth: [300] }, tableParagraphBuilder())
//         )
//       )
//     ));
// });

import ist from 'ist';
import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { defaultCell, cellWAnchor, cellWDimension, cell, row, table, emptyCell, emptyHeaderCell, headerCell, tableDoc, tableP } from '../../../command/test/tableTestUtil';
import { A, ANCHOR, B, ProseMirrorNodeWithTag, validateNodeWithTag } from '../../../command/test/testUtil';
import { TableMap } from '../class';

import { clipCells, insertCells, pastedCells, PastedCellsReturnType } from './tableCopyPaste';
import { getResolvedCellPosAroundResolvedPos } from './util';

// ********************************************************************************
// == Table Copy Paste Test =======================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-copypaste.js

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
    const startState = table(row(`<${A}>`, emptyCell, emptyCell, `<${B}>`));
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCell, emptyCell],
    ];

    executePastedCellsTest(startState, 2/*width*/, 1/*height*/, rowsContent);
  });

  it('returns Cells wrapped in a row', () => {
    const startState = table(`<${A}>`, row(emptyCell, emptyCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCell, emptyCell],
    ];

    executePastedCellsTest(startState, 2/*width*/, 1/*height*/, rowsContent);
  });

  it('returns Cells when the cursor is inside them', () => {
    const startState = table(row(cell(tableP(`<${A}>foo`)), cell(tableP(`<${B}>bar`))));
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cell(tableP('foo')), emptyCell],
    ];

    executePastedCellsTest(startState, 2/*width*/, 1/*height*/, rowsContent);
  });

  it('returns multiple rows', () => {
    const startState = table(row(`<${A}>`, emptyCell, emptyCell), row(emptyCell, defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCell, emptyCell],
      [emptyCell, defaultCell],
    ];

    executePastedCellsTest(startState, 2/*width*/, 2/*height*/, rowsContent);
  });

  it('will enter a fully selected table', () => {
    const startState = tableDoc(`<${A}>`, table(row(defaultCell)), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [defaultCell],
    ];

    executePastedCellsTest(startState, 1/*width*/, 1/*height*/, rowsContent);
  });

  it('can normalize a partially-selected row', () => {
    const startState = table(row(cell(tableP(), `<${A}>`), emptyCell, defaultCell), row(defaultCell, defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCell, defaultCell],
      [defaultCell, defaultCell],
    ];

    executePastedCellsTest(startState, 2/*width*/, 2/*height*/, rowsContent);
  });

  it('will make sure the result is rectangular', () => {
    const startState = table(`<${A}>`, row(cellWDimension(2, 2), defaultCell), row(), row(defaultCell, defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWDimension(2, 2), defaultCell],
      [emptyCell],
      [defaultCell, defaultCell, emptyCell],
    ];

    executePastedCellsTest(startState, 3/*width*/, 3/*height*/, rowsContent);
  });

  it('can handle rowspans sticking out', () => {
    const startState = table(`<${A}>`, row(cellWDimension(1, 3), defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWDimension(1, 3), defaultCell],
      [emptyCell],
      [emptyCell],
    ];

    executePastedCellsTest(startState, 2/*width*/, 3/*height*/, rowsContent);
  });

  it('returns null for non-cell selection', () => {
    const startState = tableDoc(tableP(`foo<${A}>bar`), tableP(`baz<${B}>`));
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
    const startState = table(`<${A}>`, row(emptyCell, defaultCell), row(defaultCell, defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCell],
    ];

    executeClipCellsTest(startState, 1/*width*/, 1/*height*/, rowsContent);
  });

  it('will pad by repeating Cells', () => {
    const startState = table(`<${A}>`, row(emptyCell, defaultCell), row(defaultCell, emptyCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [emptyCell, defaultCell, emptyCell, defaultCell],
      [defaultCell, emptyCell, defaultCell, emptyCell],
      [emptyCell, defaultCell, emptyCell, defaultCell],
      [defaultCell, emptyCell, defaultCell, emptyCell],
    ];

    executeClipCellsTest(startState, 4/*width*/, 4/*height*/, rowsContent);
  });

  it('takes rowspan into account when counting width', () => {
    const startState = table(`<${A}>`, row(cellWDimension(2, 2), defaultCell), row(defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWDimension(2, 2), defaultCell, cellWDimension(2, 2), defaultCell],
      [defaultCell, defaultCell],
    ];

    executeClipCellsTest(startState, 6/*width*/, 2/*height*/, rowsContent);
  });

  it('clips off excess colspan', () => {
    const startState = table(`<${A}>`, row(cellWDimension(2, 2), defaultCell), row(defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWDimension(2, 2), defaultCell, cellWDimension(1, 2)],
      [defaultCell],
    ];

    executeClipCellsTest(startState, 4/*width*/, 2/*height*/, rowsContent);
  });

  it('clips off excess rowspan', () => {
    const startState = table(`<${A}>`, row(cellWDimension(2, 2), defaultCell), row(defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWDimension(2, 2)],
      [],
      [cellWDimension(2, 1)],
    ];

    executeClipCellsTest(startState, 2/*width*/, 3/*height*/, rowsContent);
  });

  it('clips off excess rowspan when new table height is bigger than the current table height', () => {
    const startState = table(`<${A}>`, row(cellWDimension(1, 2), cellWDimension(2, 1)), row(defaultCell, defaultCell), `<${B}>`);
    if(!validateNodeWithTag(startState)) throw new Error('expected startState to be a ProseMirrorNodeWithTag');

    const rowsContent = [
      [cellWDimension(1, 1), cellWDimension(2, 1)],
    ];

    executeClipCellsTest(startState, 3/*width*/, 1/*height*/, rowsContent);
  });

});

describe('insertCells', () => {
  const executeInsertCellsTest = (table: ProseMirrorNodeWithTag, cells: ProseMirrorNodeWithTag, result: ProseMirrorNode) => {
    const { [ANCHOR]: anchorPos } = table.tag;
    if(anchorPos === null/*explicit check since it can be 0*/) throw new Error('expected anchor pos to be defined its not');

    let state = EditorState.create({ doc: table });
    const $cellPos = getResolvedCellPosAroundResolvedPos(table.resolve(anchorPos));
    if($cellPos === null/*explicit check since it can be 0*/) throw new Error('$cellPos does not exist');

    const tableMap = TableMap.getTableMap(table);

    const { [A]: cellsSliceFromPos, [B]: cellsSliceToPos } = cells.tag;
    if(cellsSliceFromPos === null/*explicit check since it can be 0*/ || cellsSliceToPos === null/*explicit check since it can be 0*/) throw new Error('expected A and B positions to be defined for the test and they are not');

    const pastedResult = pastedCells(cells.slice(cellsSliceFromPos, cellsSliceToPos));
    if(pastedResult === null) throw new Error('expected pastedResult to be valid');

    insertCells(state, (tr) => (state = state.apply(tr)), 0/*tableStart pos*/, tableMap.getCellTableRect($cellPos.pos), pastedResult);
    ist(state.doc, result, eq);
  };

  it('keeps the original Cells', () => {
    const startState =
      table(
        row(cellWAnchor, defaultCell, defaultCell),
        row(defaultCell, defaultCell, defaultCell));
    const cells =
      table(
        row(cell(tableP(`<${A}>foo`)), emptyCell),
        row(cellWDimension(2, 1), `<${B}>`));
    if(!validateNodeWithTag(startState) || !validateNodeWithTag(cells)) throw new Error('expected startState and cells to be ProseMirrorNodesWithTag');

    const expectedResult = table(row(cell(tableP('foo')), emptyCell, defaultCell), row(cellWDimension(2, 1), defaultCell));

    executeInsertCellsTest(startState, cells, expectedResult);
  });

  it('makes sure the table is big enough', () => {
    const startState =
      table(
        row(cellWAnchor));
    const cells =
      table(
        row(cell(tableP(`<${A}>foo`)), emptyCell),
        row(cellWDimension(2, 1), `<${B}>`));
    if(!validateNodeWithTag(startState) || !validateNodeWithTag(cells)) throw new Error('expected startState and cells to be ProseMirrorNodesWithTag');

    const expectedResult =
      table(
        row(cell(tableP('foo')), emptyCell),
        row(cellWDimension(2, 1)));

    executeInsertCellsTest(startState, cells, expectedResult);
  });

  it('preserves headers while growing a table', () => {
    const startState = table(
      row(headerCell, headerCell, headerCell),
      row(headerCell, defaultCell, defaultCell),
      row(headerCell, defaultCell, cellWAnchor));
    const cells =
      table(
        row(cell(tableP(`<${A}>foo`)), emptyCell),
        row(defaultCell, defaultCell, `<${B}>`));
    if(!validateNodeWithTag(startState) || !validateNodeWithTag(cells)) throw new Error('expected startState and cells to be ProseMirrorNodesWithTag');

    const expectedResult = table(
      row(headerCell, headerCell, headerCell, emptyHeaderCell),
      row(headerCell, defaultCell, defaultCell, emptyCell),
      row(headerCell, defaultCell, cell(tableP('foo')), emptyCell),
      row(emptyHeaderCell, emptyCell, defaultCell, defaultCell)
    );

    executeInsertCellsTest(startState, cells, expectedResult);
  });

  it('will split interfering rowSpan Cells', () => {
    const startState = table(
      row(defaultCell, cellWDimension(1, 4), defaultCell),
      row(cellWAnchor, defaultCell),
      row(defaultCell, defaultCell),
      row(defaultCell, defaultCell)
    );
    const cells =
      table(
        row(`<${A}>`, emptyCell, emptyCell, emptyCell, `<${B}>`));
    if(!validateNodeWithTag(startState) || !validateNodeWithTag(cells)) throw new Error('expected startState and cells to be ProseMirrorNodesWithTag');

    const expectedResult = table(
      row(defaultCell, defaultCell, defaultCell),
      row(emptyCell, emptyCell, emptyCell),
      row(defaultCell, cell({ [AttributeType.RowSpan]: 2 }, tableP()), defaultCell),
      row(defaultCell, defaultCell)
    );

    executeInsertCellsTest(startState, cells, expectedResult);
  });

  it('will split interfering colSpan Cells', () => {
    const startState =
      table(
        row(defaultCell, cellWAnchor, defaultCell),
        row(cellWDimension(2, 1), defaultCell),
        row(defaultCell, cellWDimension(2, 1)));
    const cells =
      table(`<${A}>`,
        row(emptyCell),
        row(emptyCell),
        row(emptyCell), `<${B}>`);

    if(!validateNodeWithTag(startState) || !validateNodeWithTag(cells)) throw new Error('expected startState and cells to be ProseMirrorNodesWithTag');

    const expectedResult = table(
      row(defaultCell, emptyCell, defaultCell),
      row(defaultCell, emptyCell, defaultCell),
      row(defaultCell, emptyCell, emptyCell)
    );

    executeInsertCellsTest(startState, cells, expectedResult);
  });

  it('preserves widths when splitting', () => {
    const startState =
      table(
        row(defaultCell, cellWAnchor, defaultCell),
        row(cell({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 200, 300] }, tableP('x')))
      );
    const cells = table(`<${A}>`, row(emptyCell), row(emptyCell), `<${B}>`);
    if(!validateNodeWithTag(startState) || !validateNodeWithTag(cells)) throw new Error('expected startState and cells to be ProseMirrorNodesWithTag');

    const expectedResult = table(
      row(defaultCell, emptyCell, defaultCell),
      row(cell({ [AttributeType.ColWidth]: [100] }, tableP('x')), emptyCell, cell({ [AttributeType.ColWidth]: [300] }, tableP()))
    );

    executeInsertCellsTest(startState, cells, expectedResult);
  });
});

import ist from 'ist';
import { Node as ProseMirrorNode, Slice } from 'prosemirror-model';
import { Command, EditorState } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { addColumnAfterCommand, addColumnBeforeCommand, addRowAfterCommand, addRowBeforeCommand } from '../../../../notebookEditor/command/table';
import { defaultCell, cellWAnchor, cellWDimension, cellWHead, cell, row, table, emptyCell, selectionForTableTest, tableDoc, tableP } from '../../../../notebookEditor/command/test/tableTestUtil';
import { A } from '../../../../notebookEditor/command/test/testUtil';
import { isCellSelection } from '../../../../notebookEditor/selection';

import { CellSelection } from './CellSelection';

// ********************************************************************************
// NOTE: these are taken from https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-cellselection.js

// == Test ========================================================================
describe('CellSelection', () => {
  // NOTE: the inline comments below are the positions of the
  //       start of the Cell Nodes
  const tDoc = tableDoc(
    table(row(/* 2*/ emptyCell, /* 6*/ emptyCell, /*10*/ emptyCell),
          row(/*16*/ emptyCell, /*20*/ emptyCell, /*24*/ emptyCell),
          row(/*30*/ emptyCell, /*34*/ emptyCell, /*36*/ emptyCell)
    )
  );

  const executeCellSelectionTestCommand = (anchor: number, head: number, testedCommand: Command) => {
    let state = EditorState.create({ doc: tDoc, selection: CellSelection.create(tDoc, anchor, head) });
    testedCommand(state, (tr) => state = state.apply(tr));
    return state;
  };

  it('will put its head/anchor around the head cell', () => {
    let selection = CellSelection.create(tDoc, 2, 24);
    ist(selection.anchor, 25);
    ist(selection.head, 27);

    selection = CellSelection.create(tDoc, 24, 2);
    ist(selection.anchor, 3);
    ist(selection.head, 5);

    selection = CellSelection.create(tDoc, 10, 30);
    ist(selection.anchor, 31);
    ist(selection.head, 33);

    selection = CellSelection.create(tDoc, 30, 10);
    ist(selection.anchor, 11);
    ist(selection.head, 13);
  });

  it('extends a row selection when adding a row', () => {
    let selection = executeCellSelectionTestCommand(34, 6, addRowBeforeCommand).selection;
    if(!isCellSelection(selection)) throw new Error('expected a CellSelection');
    ist(selection.$anchorCell.pos, 48);
    ist(selection.$headCell.pos, 6);

    selection = executeCellSelectionTestCommand(6, 30, addRowAfterCommand).selection;
    if(!isCellSelection(selection)) throw new Error('expected a CellSelection');
    ist(selection.$anchorCell.pos, 6);
    ist(selection.$headCell.pos, 44);
  });

  it('extends a col selection when adding a column', () => {
    let selection = executeCellSelectionTestCommand(16, 24, addColumnAfterCommand).selection;
    if(!isCellSelection(selection)) throw new Error('expected a CellSelection');
    ist(selection.$anchorCell.pos, 20);
    ist(selection.$headCell.pos, 32);

    selection = executeCellSelectionTestCommand(24, 30, addColumnBeforeCommand).selection;
    if(!isCellSelection(selection)) throw new Error('expected a CellSelection');
    ist(selection.$anchorCell.pos, 32);
    ist(selection.$headCell.pos, 38);
  });
});

describe('CellSelection.content', () => {
  const sliceStartAndEnd = (doc: ProseMirrorNode) => new Slice(doc.content, 1/*cut one position at start*/, 1/*cut one position at end*/);
  const compareStringifiedSlice = (a: Slice, b: Slice) => JSON.stringify(a) === JSON.stringify(b);

  it('contains only the selected cells', () => {
    const selectionContent =
      selectionForTableTest(
          table(row(defaultCell, cellWAnchor, emptyCell),
                row(defaultCell, emptyCell, cellWHead),
                row(defaultCell, defaultCell, defaultCell)
       )
      )?.content();

    ist(selectionContent, sliceStartAndEnd(
      table(`<${A}>`, row(defaultCell, emptyCell),
                      row(emptyCell, defaultCell))),
      compareStringifiedSlice);
  });

  it('understands spanning cells', () => {
    const selectionContent =
      selectionForTableTest(
          table(row(cellWAnchor, cellWDimension(2, 2), defaultCell, defaultCell),
                row(defaultCell, cellWHead, defaultCell, defaultCell))
      )?.content();

    ist(selectionContent, sliceStartAndEnd(
      table(row(defaultCell, cellWDimension(2, 2), defaultCell),
            row(defaultCell, defaultCell))),
      compareStringifiedSlice);
  });

  it('cuts off cells sticking out horizontally', () => {
    const selectionContent =
      selectionForTableTest(
          table(row(defaultCell, cellWAnchor, cellWDimension(2, 1)),
                row(cellWDimension(4, 1)),
                row(cellWDimension(2, 1), cellWHead, defaultCell))
      )?.content();

    ist(selectionContent, sliceStartAndEnd(
      table(row(defaultCell, defaultCell),
            row(cell({ [AttributeType.ColSpan]: 2 }, tableP())),
            row(emptyCell, defaultCell))),
      compareStringifiedSlice);
  });

  it('cuts off cells sticking out vertically', () => {
    const selectionContent =
      selectionForTableTest(
        table(row(defaultCell, cellWDimension(1, 4), cellWDimension(1, 2)),
              row(cellWAnchor),
              row(cellWDimension(1, 2), cellWHead),
              row(defaultCell)
        )
      )?.content();

    ist(selectionContent,
      sliceStartAndEnd(table(row(defaultCell, cell({ [AttributeType.RowSpan]: 2 }, tableP()), emptyCell),
                             row(defaultCell, defaultCell))),
      compareStringifiedSlice);
  });

  it('preserves column widths', () => {
    const selectionContent =
      selectionForTableTest(
        table(row(defaultCell, cellWAnchor, defaultCell),
              row(cell({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 200, 300] }, tableP('x'))),
              row(defaultCell, cellWHead, defaultCell)
        )
      )?.content();

    ist(selectionContent,
      sliceStartAndEnd(table(row(defaultCell),
                             row(cell({ [AttributeType.ColWidth]: [200] }, tableP())),
                             row(defaultCell))),
      compareStringifiedSlice);
  });

});


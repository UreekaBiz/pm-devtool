import ist from 'ist';
import { Node as ProseMirrorNode, Slice } from 'prosemirror-model';
import { Command, EditorState } from 'prosemirror-state';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { addColumnAfterCommand, addColumnBeforeCommand, addRowAfterCommand, addRowBeforeCommand } from '../../../../notebookEditor/command/table';
import { cellBuilder, cellWithAnchorBuilder, cellWithDimensionBuilder, cellWithHeadBuilder, defaultCellBuilder, defaultRowBuilder, defaultTableBuilder, emptyCellBuilder, selectionForTableTest } from '../../../../notebookEditor/command/test/tableTestUtil';
import { getNotebookSchemaNodeBuilders, A } from '../../../../notebookEditor/command/test/testUtil';
import { NodeName } from '../../../../notebookEditor/node';
import { isCellSelection } from '../../../../notebookEditor/selection';

import { CellSelection } from './CellSelection';

// ********************************************************************************
// == Constant ====================================================================
const { [NodeName.DOC]: docBuilder, [NodeName.PARAGRAPH]: paragraphBuilder } = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.PARAGRAPH]);

// == Test ========================================================================
describe('CellSelection', () => {
  // NOTE: the inline comments below are the positions of the
  //       start of the Cell Nodes
  const tableDoc = docBuilder(
    defaultTableBuilder(
        defaultRowBuilder(/* 2*/ emptyCellBuilder, /* 6*/ emptyCellBuilder, /*10*/ emptyCellBuilder),
        defaultRowBuilder(/*16*/ emptyCellBuilder, /*20*/ emptyCellBuilder, /*24*/ emptyCellBuilder),
        defaultRowBuilder(/*30*/ emptyCellBuilder, /*34*/ emptyCellBuilder, /*36*/ emptyCellBuilder)
    )
  );

  const executeCellSelectionTestCommand = (anchor: number, head: number, testedCommand: Command) => {
    let state = EditorState.create({ doc: tableDoc, selection: CellSelection.create(tableDoc, anchor, head) });
    testedCommand(state, (tr) => state = state.apply(tr));
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
          defaultTableBuilder(
            defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, emptyCellBuilder),
            defaultRowBuilder(cellBuilder, emptyCellBuilder, cellWithHeadBuilder),
            defaultRowBuilder(cellBuilder, cellBuilder, cellBuilder)
       )
      )?.content();

    ist(selectionContent, sliceStartAndEnd(
      defaultTableBuilder(`<${A}>`, defaultRowBuilder(cellBuilder, emptyCellBuilder),
                                    defaultRowBuilder(emptyCellBuilder, cellBuilder))),
      compareStringifiedSlice);
  });

  it('understands spanning cells', () => {
    const selectionContent =
      selectionForTableTest(
          defaultTableBuilder(
            defaultRowBuilder(cellWithAnchorBuilder, cellWithDimensionBuilder(2, 2), cellBuilder, cellBuilder),
            defaultRowBuilder(cellBuilder, cellWithHeadBuilder, cellBuilder, cellBuilder))
      )?.content();

    ist(selectionContent, sliceStartAndEnd(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(2, 2), cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))),
      compareStringifiedSlice);
  });

  it('cuts off cells sticking out horizontally', () => {
    const selectionContent =
      selectionForTableTest(
          defaultTableBuilder(
            defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellWithDimensionBuilder(2, 1)),
            defaultRowBuilder(cellWithDimensionBuilder(4, 1)),
            defaultRowBuilder(cellWithDimensionBuilder(2, 1), cellWithHeadBuilder, cellBuilder))
      )?.content();

    ist(selectionContent, sliceStartAndEnd(
      defaultTableBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 2 }, paragraphBuilder())),
        defaultRowBuilder(emptyCellBuilder, cellBuilder))),
      compareStringifiedSlice);
  });

  it('cuts off cells sticking out vertically', () => {
    const selectionContent =
      selectionForTableTest(
        defaultTableBuilder(
          defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 4), cellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellWithAnchorBuilder),
          defaultRowBuilder(cellWithDimensionBuilder(1, 2), cellWithHeadBuilder),
          defaultRowBuilder(cellBuilder)
        )
      )?.content();

    ist(selectionContent,
      sliceStartAndEnd(defaultTableBuilder(
        defaultRowBuilder(cellBuilder, defaultCellBuilder({ [AttributeType.RowSpan]: 2 }, paragraphBuilder()), emptyCellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder))),
      compareStringifiedSlice);
  });

  it('preserves column widths', () => {
    const selectionContent =
      selectionForTableTest(
        defaultTableBuilder(
          defaultRowBuilder(cellBuilder, cellWithAnchorBuilder, cellBuilder),
          defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.ColWidth]: [100, 200, 300] }, paragraphBuilder('x'))),
          defaultRowBuilder(cellBuilder, cellWithHeadBuilder, cellBuilder)
        )
      )?.content();

    ist(selectionContent,
      sliceStartAndEnd(defaultTableBuilder(defaultRowBuilder(cellBuilder),
        defaultRowBuilder(defaultCellBuilder({ [AttributeType.ColWidth]: [200] }, paragraphBuilder())),
        defaultRowBuilder(cellBuilder))),
      compareStringifiedSlice);
  });

});


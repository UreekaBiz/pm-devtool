import ist from 'ist';
import { EditorState, NodeSelection, Selection } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';

import { cellBuilder, CellSelection, defaultRowBuilder, defaultTableBuilder, getNotebookSchemaNodeBuilders, NodeName } from 'common';
import { tableEditingPlugin } from './tableEditing';

// == Constant ====================================================================
const { [NodeName.DOC]: docBuilder } = getNotebookSchemaNodeBuilders([NodeName.DOC]);

// == Test ========================================================================
describe('normalizeTableSelection', () => {
  // NOTE: the inline comments below are the positions of the
  //       start of the Cell Nodes
  const tableDoc = docBuilder(
    defaultTableBuilder(
      defaultRowBuilder(/* 2*/ cellBuilder, /* 7*/ cellBuilder, /*12*/ cellBuilder),
      defaultRowBuilder(/*19*/ cellBuilder, /*24*/ cellBuilder, /*29*/ cellBuilder),
      defaultRowBuilder(/*36*/ cellBuilder, /*41*/ cellBuilder, /*46*/ cellBuilder)
    )
  );

  const normalizeTableSelection = (selection: Selection, { allowTableNodeSelection = false/*default*/ } = {}) => {
    let state = EditorState.create({
      doc: tableDoc,
      selection,
      plugins: [tableEditingPlugin(allowTableNodeSelection)],
    });

    return state.apply(state.tr).selection;
  };

  it('converts a Table NodeSelection into a selection of all Cells in the Table', () =>
    ist(normalizeTableSelection(NodeSelection.create(tableDoc, 0)), CellSelection.create(tableDoc, 2, 46), eq));

  it('retains a Table NodeSelection if the allowTableNodeSelection option is true', () =>
    ist(normalizeTableSelection(NodeSelection.create(tableDoc, 0), { allowTableNodeSelection: true }), NodeSelection.create(tableDoc, 0), eq));

  it('converts a Row NodeSelection into a cell selection', () =>
    ist(normalizeTableSelection(NodeSelection.create(tableDoc, 1)), CellSelection.create(tableDoc, 2, 12), eq));

  it('converts a Cell NodeSelection into a CellSelection', () =>
    ist(normalizeTableSelection(NodeSelection.create(tableDoc, 2)), CellSelection.create(tableDoc, 2, 2), eq));
});

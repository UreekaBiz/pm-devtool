import ist from 'ist';
import { EditorState, NodeSelection, Selection } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';

import { defaultCell, CellSelection, row, table, tableDoc } from 'common';
import { tableEditingPlugin } from './tableEditing';

// == Test ========================================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-column-resizing.js

describe('normalizeTableSelection', () => {
  // NOTE: the inline comments below are the positions of the
  //       start of the Cell Nodes
  const tDoc = tableDoc(
    table(
      row(/* 2*/ defaultCell, /* 7*/ defaultCell, /*12*/ defaultCell),
      row(/*19*/ defaultCell, /*24*/ defaultCell, /*29*/ defaultCell),
      row(/*36*/ defaultCell, /*41*/ defaultCell, /*46*/ defaultCell)
    )
  );

  const normalizeTableSelection = (selection: Selection, { allowTableNodeSelection = false/*default*/ } = {}) => {
    let state = EditorState.create({
      doc: tDoc,
      selection,
      plugins: [tableEditingPlugin(allowTableNodeSelection)],
    });

    return state.apply(state.tr).selection;
  };

  it('converts a Table NodeSelection into a selection of all Cells in the Table', () =>
    ist(normalizeTableSelection(NodeSelection.create(tDoc, 0)), CellSelection.create(tDoc, 2, 46), eq));

  it('retains a Table NodeSelection if the allowTableNodeSelection option is true', () =>
    ist(normalizeTableSelection(NodeSelection.create(tDoc, 0), { allowTableNodeSelection: true }), NodeSelection.create(tDoc, 0), eq));

  it('converts a Row NodeSelection into a cell selection', () =>
    ist(normalizeTableSelection(NodeSelection.create(tDoc, 1)), CellSelection.create(tDoc, 2, 12), eq));

  it('converts a Cell NodeSelection into a CellSelection', () =>
    ist(normalizeTableSelection(NodeSelection.create(tDoc, 2)), CellSelection.create(tDoc, 2, 2), eq));
});

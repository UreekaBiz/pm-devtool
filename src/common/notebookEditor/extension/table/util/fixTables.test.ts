import ist from 'ist';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';

import { defaultCell, cellWDimension, colWidth100Cell, colWidth200Cell, cell, row, table, emptyCell, emptyHeaderCell, headerCell, tableDoc, tableP } from '../../../../notebookEditor/command/test/tableTestUtil';
import { AttributeType } from '../../../attribute';
import { fixTables } from './fixTables';

// ********************************************************************************
// == Table Fixing ================================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-fixtable.js

const applyTableFix = (table: ProseMirrorNode) => {
  const state = EditorState.create({ doc: tableDoc(table) });
  const tr = fixTables(undefined/*no oldState, inspect given state*/, state);
  return tr && tr.doc.firstChild;
};

describe('fixTable', () => {
  it('does not touch correct tables', () => {
    const startingState =
      table(row(defaultCell, defaultCell, cellWDimension(1, 2)),
            row(defaultCell, defaultCell));

    const expectedEndState = startingState/*same*/;

    ist(applyTableFix(startingState), expectedEndState, eq);
  });

  it('adds trivially missing Cells', () => {
    ist(
      applyTableFix(
        table(row(defaultCell, defaultCell, cellWDimension(1, 2)),
              row(defaultCell))),

      table(row(defaultCell, defaultCell, cellWDimension(1, 2)),
            row(defaultCell, emptyCell)),

      eq
    );
  });

  it('can add to multiple rows', () => {
    ist(
      applyTableFix(
        table(row(defaultCell),
              row(defaultCell, defaultCell),
              row(cellWDimension(3, 1)))),

      table(row(defaultCell, emptyCell, emptyCell),
            row(emptyCell, defaultCell, defaultCell),
            row(cellWDimension(3, 1))),

      eq
    );
  });

  it('will default to adding at the start of the first row', () => {
    ist(
      applyTableFix(
        table(row(defaultCell),
              row(defaultCell, defaultCell))),

      table(row(emptyCell, defaultCell),
            row(defaultCell, defaultCell)),

      eq
    );
  });

  it('will default to adding at the end of the non-first row', () => {
    ist(
      applyTableFix(
        table(row(defaultCell, defaultCell),
              row(defaultCell))),

      table(row(defaultCell, defaultCell),
            row(defaultCell, emptyCell)),

      eq
    );
  });

  it('will fix overlapping Cells', () => {
    ist(
      applyTableFix(
        table(row(defaultCell, cellWDimension(1, 2), defaultCell),
              row(cellWDimension(2, 1)))),

      table(row(defaultCell, cellWDimension(1, 2), defaultCell),
            row(defaultCell, emptyCell, emptyCell)),

      eq
    );
  });

  it('will fix a rowSpan that sticks out of the Table', () => {
    ist(
      applyTableFix(
        table(row(defaultCell, defaultCell),
              row(cellWDimension(1, 2), defaultCell))),

      table(row(defaultCell, defaultCell),
            row(defaultCell, defaultCell)),

      eq
    );
  });

  it('makes sure column widths are coherent', () => {
    ist(
      applyTableFix(
        table(row(defaultCell, defaultCell, colWidth200Cell),
              row(colWidth100Cell, defaultCell, defaultCell))),

      table(row(colWidth100Cell, defaultCell, colWidth200Cell),
            row(colWidth100Cell, defaultCell, colWidth200Cell)),

      eq
    );
  });

  it('can update column widths on colSpan Cells', () => {
    ist(
      applyTableFix(
        table(row(defaultCell, defaultCell, colWidth200Cell),
              row(cellWDimension(3, 2)),
              row())),

      table(row(defaultCell, defaultCell, colWidth200Cell),
            row(cell({ [AttributeType.ColSpan]: 3, [AttributeType.RowSpan]: 2, [AttributeType.ColWidth]: [0, 0, 200] }, tableP('x'))),
            row()
      ),

      eq
    );
  });

  it('will update the odd one out when column widths disagree', () => {
    ist(
      applyTableFix(
        table(row(colWidth100Cell, colWidth100Cell, colWidth100Cell),
              row(colWidth200Cell, colWidth200Cell, colWidth100Cell),
              row(colWidth100Cell, colWidth200Cell, colWidth200Cell)
        )
      ),
      table(row(colWidth100Cell, colWidth200Cell, colWidth100Cell),
            row(colWidth100Cell, colWidth200Cell, colWidth100Cell),
            row(colWidth100Cell, colWidth200Cell, colWidth100Cell)
      ),
      eq
    );
  });

  it('respects table role when inserting a Cell', () => {
    ist(
      applyTableFix(
        table(row(headerCell),
              row(defaultCell, defaultCell),
              row(cellWDimension(3, 1)))),

      table(row(headerCell, emptyHeaderCell, emptyHeaderCell),
            row(emptyCell, defaultCell, defaultCell),
            row(cellWDimension(3, 1))),
      eq
    );
  });
});

import ist from 'ist';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';

import { cellBuilder, cellWithDimensionBuilder, colWidth100CellBuilder, colWidth200CellBuilder, defaultRowBuilder, emptyCellBuilder, emptyHeaderCellBuilder, headerCellBuilder, tableDocBuilder, tableParagraphBuilder } from '../../../../notebookEditor/command/test/tableTestUtil';
import { AttributeType } from '../../../attribute';
import { fixTables } from './fixTables';

// ********************************************************************************
// == Table Fixing ================================================================
const applyTableFix = (table: ProseMirrorNode) => {
  const state = EditorState.create({ doc: tableDocBuilder(table) });
  const tr = fixTables(undefined/*no oldState, inspect given state*/, state);
  return tr && tr.doc.firstChild;
};

describe('fixTable', () => {
  it('does not touch correct tables', () => {
    ist(applyTableFix(
      tableDocBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(cellBuilder, cellBuilder))),
      null/*expect same state*/);
  });

  it('adds trivially missing Cells', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder, cellBuilder, cellWithDimensionBuilder(1, 2)),
          defaultRowBuilder(cellBuilder))),

      tableDocBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, cellWithDimensionBuilder(1, 2)),
        defaultRowBuilder(cellBuilder, emptyCellBuilder)),

      eq
    );
  });

  it('can add to multiple rows', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder),
          defaultRowBuilder(cellWithDimensionBuilder(3, 1)))),

      tableDocBuilder(
        defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellWithDimensionBuilder(3, 1))),

      eq
    );
  });

  it('will default to adding at the start of the first row', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder))),

      tableDocBuilder(
        defaultRowBuilder(emptyCellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      eq
    );
  });

  it('will default to adding at the end of the non-first row', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder, cellBuilder),
          defaultRowBuilder(cellBuilder))),

      tableDocBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder)),

      eq
    );
  });

  it('will fix overlapping Cells', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 2), cellBuilder),
          defaultRowBuilder(cellWithDimensionBuilder(2, 1)))),

      tableDocBuilder(
        defaultRowBuilder(cellBuilder, cellWithDimensionBuilder(1, 2), cellBuilder),
        defaultRowBuilder(cellBuilder, emptyCellBuilder, emptyCellBuilder)),

      eq
    );
  });

  it('will fix a rowSpan that sticks out of the Table', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder, cellBuilder),
          defaultRowBuilder(cellWithDimensionBuilder(1, 2), cellBuilder))),

      tableDocBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder),
        defaultRowBuilder(cellBuilder, cellBuilder)),

      eq
    );
  });

  it('makes sure column widths are coherent', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder, cellBuilder, colWidth200CellBuilder),
          defaultRowBuilder(colWidth100CellBuilder, cellBuilder, cellBuilder))),

      tableDocBuilder(
        defaultRowBuilder(colWidth100CellBuilder, cellBuilder, colWidth200CellBuilder),
        defaultRowBuilder(colWidth100CellBuilder, cellBuilder, colWidth200CellBuilder)),

      eq
    );
  });

  it('can update column widths on colspan Cells', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(cellBuilder, cellBuilder, colWidth200CellBuilder),
          defaultRowBuilder(cellWithDimensionBuilder(3, 2)),
          defaultRowBuilder())),

      tableDocBuilder(
        defaultRowBuilder(cellBuilder, cellBuilder, colWidth200CellBuilder),
        defaultRowBuilder(defaultRowBuilder({ [AttributeType.ColSpan]: 3, [AttributeType.RowSpan]: 2, [AttributeType.ColWidth]: [0, 0, 200] }, tableParagraphBuilder('x'))),
        defaultRowBuilder()
      ),
      eq
    );
  });

  it('will update the odd one out when column widths disagree', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(colWidth100CellBuilder, colWidth100CellBuilder, colWidth100CellBuilder),
          defaultRowBuilder(colWidth200CellBuilder, colWidth200CellBuilder, colWidth100CellBuilder),
          defaultRowBuilder(colWidth100CellBuilder, colWidth200CellBuilder, colWidth200CellBuilder)
        )
      ),
      tableDocBuilder(
        defaultRowBuilder(colWidth100CellBuilder, colWidth200CellBuilder, colWidth100CellBuilder),
        defaultRowBuilder(colWidth100CellBuilder, colWidth200CellBuilder, colWidth100CellBuilder),
        defaultRowBuilder(colWidth100CellBuilder, colWidth200CellBuilder, colWidth100CellBuilder)
      ),
      eq
    );
  });

  it('respects table role when inserting a Cell', () => {
    ist(
      applyTableFix(
        tableDocBuilder(
          defaultRowBuilder(headerCellBuilder),
          defaultRowBuilder(cellBuilder, cellBuilder),
          defaultRowBuilder(cellWithDimensionBuilder(3, 1)))),

      tableDocBuilder(
        defaultRowBuilder(headerCellBuilder, emptyHeaderCellBuilder, emptyHeaderCellBuilder),
        defaultRowBuilder(emptyCellBuilder, cellBuilder, cellBuilder),
        defaultRowBuilder(cellWithDimensionBuilder(3, 1))),
      eq
    );
  });
});

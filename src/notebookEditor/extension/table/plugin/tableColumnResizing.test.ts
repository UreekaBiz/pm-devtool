import ist from 'ist';
import { EditorState } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';

import { defaultRowBuilder, defaultTableBuilder, emptyCellBuilder, tableDocBuilder } from 'common';

import { handleColumnResizingDecorations } from './tableColumnResizing';

// ********************************************************************************
// == Table Column Resizing Test ==================================================
describe('handleColumnResizingDecorations', () => {
  it('returns an empty DecorationSet if cell is null or undefined', () => {
    let state = EditorState.create({ doc:
        tableDocBuilder(
          defaultTableBuilder(
            defaultRowBuilder(/* 2*/ emptyCellBuilder, /* 6*/ emptyCellBuilder, /*10*/ emptyCellBuilder))) });

    ist(handleColumnResizingDecorations(state, null), DecorationSet.empty);
  });
});

import { Command } from 'prosemirror-state';

import { mergeCells, splitCell } from '../../command';

export const mergeOrSplitCommand: Command = (state, dispatch) => {
  if(mergeCells(state, dispatch))
    return true/*cells can be merged*/;
  /* else -- cells cannot be merged, split */

  return splitCell(state, dispatch);
};

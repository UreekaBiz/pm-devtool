import { Command } from 'common';

// ********************************************************************************
/** Inserts a Tab. (SEE: ExtensionPriority) for details on handling */
export const insertTabCommand: Command = (state, dispatch) => {
  const { tr } = state;
  tr.insertText('\t');

  dispatch(tr);
  return true/*Command executed*/;
};

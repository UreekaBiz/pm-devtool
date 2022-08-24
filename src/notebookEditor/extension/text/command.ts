import { Command } from 'common';

// ********************************************************************************
/** Inserts a Tab. (SEE: ExtensionPriority) for details on handling */
export const insertTabCommand: Command = (state, dispatch) => {
  const { tr } = state;
  tr.insertText('\t');

  if(dispatch) dispatch(tr);
  return true/*command can be executed*/;
};

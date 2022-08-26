import { Command, MarkName } from 'common';

import { toggleOrSetMarkCommand } from '../markHolder/command';

// ********************************************************************************
export const toggleBoldCommand: Command = (state, dispatch) =>
  toggleOrSetMarkCommand(MarkName.BOLD, state.schema.marks[MarkName.BOLD])(state, dispatch);


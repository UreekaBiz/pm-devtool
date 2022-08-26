import { Command, MarkName } from 'common';

import { toggleOrSetMarkCommand } from '../markHolder/command';

// ********************************************************************************
export const toggleStrikethroughCommand: Command = (state, dispatch) =>
  toggleOrSetMarkCommand(MarkName.STRIKETHROUGH, state.schema.marks[MarkName.STRIKETHROUGH])(state, dispatch);

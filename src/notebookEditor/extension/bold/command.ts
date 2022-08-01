import { CommandProps } from '@tiptap/core';

import { CommandFunctionType, MarkName } from 'common';

import { handleMarkHolderPresence, isMarkHolderPresent } from 'notebookEditor/extension/markHolder/MarkHolder';

// ********************************************************************************
// NOTE: ambient module to ensure command is TypeScript-registered for TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [MarkName.BOLD/*Expected and guaranteed to be unique. (SEE: /notebookEditor/model/node)*/]: {
      setBold: CommandFunctionType<typeof setBoldCommand, ReturnType>;
      unsetBold: CommandFunctionType<typeof unsetBoldCommand, ReturnType>;
      toggleBold: CommandFunctionType<typeof toggleBoldCommand, ReturnType>;
    };
  }
}

// --------------------------------------------------------------------------------
export const setBoldCommand = () => ({ commands }: CommandProps) => commands.setMark(MarkName.BOLD);
export const unsetBoldCommand = () => ({ commands }: CommandProps) => commands.unsetMark(MarkName.BOLD);
export const toggleBoldCommand = () => ({ editor, chain, commands }: CommandProps) => {
  const markHolder = isMarkHolderPresent(editor);
  if(markHolder) {
    return handleMarkHolderPresence(editor.state.selection, chain, markHolder, editor.schema.marks[MarkName.BOLD]);
  }/* else -- return default command */

  return commands.toggleMark(MarkName.BOLD);
};

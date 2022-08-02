import { CommandProps } from '@tiptap/core';

import { CommandFunctionType, MarkName } from 'common';

import { toggleMarkInMarkHolder, getMarkHolder } from 'notebookEditor/extension/markHolder/util';

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
  // If markHolder is defined toggle the mark inside it.
  const markHolder = getMarkHolder(editor);
  if(markHolder) return toggleMarkInMarkHolder(editor.state.selection, chain, markHolder, editor.schema.marks[MarkName.BOLD])/*nothing else to do*/;
  // else -- mark holder is not present

  return commands.toggleMark(MarkName.BOLD);
};

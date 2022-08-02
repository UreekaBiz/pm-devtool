import { CommandProps } from '@tiptap/core';

import { CommandFunctionType, MarkName } from 'common';

import { toggleMarkInMarkHolder, getMarkHolder } from 'notebookEditor/extension/markHolder/util';

// ********************************************************************************
// NOTE: ambient module to ensure command is TypeScript-registered for TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [MarkName.STRIKETHROUGH]: {
      setStrikethrough: CommandFunctionType<typeof setStrikethroughCommand, ReturnType>;
      unsetStrikethrough: CommandFunctionType<typeof unsetStrikethroughCommand, ReturnType>;
      toggleStrikethrough: CommandFunctionType<typeof toggleStrikethroughCommand, ReturnType>;
    };
  }
}

// --------------------------------------------------------------------------------
export const setStrikethroughCommand = () => ({ commands }: CommandProps) => commands.setMark(MarkName.STRIKETHROUGH);
export const unsetStrikethroughCommand = () => ({ commands }: CommandProps) => commands.unsetMark(MarkName.STRIKETHROUGH);
export const toggleStrikethroughCommand = () => ({ editor, chain, commands }: CommandProps) => {
  // If markHolder is defined toggle the mark inside it.
  const markHolder = getMarkHolder(editor);
  if(markHolder) return toggleMarkInMarkHolder(editor.state.selection, chain, markHolder, editor.schema.marks[MarkName.STRIKETHROUGH])/*nothing else to do*/;
  /* else -- mark holder is not present */

  return commands.toggleMark(MarkName.STRIKETHROUGH);
};

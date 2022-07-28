import { CommandProps } from '@tiptap/core';

import { CommandFunctionType, MarkName } from 'common';

// ********************************************************************************
// NOTE: ambient module to ensure command is TypeScript-registered for TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [MarkName.STRIKETHROUGH]: {
      setStrike: CommandFunctionType<typeof setStrikeCommand, ReturnType>;
      toggleStrike: CommandFunctionType<typeof toggleStrikeCommand, ReturnType>;
      unsetStrike: CommandFunctionType<typeof unsetStrikeCommand, ReturnType>;
    };
  }
}

// --------------------------------------------------------------------------------
export const setStrikeCommand = () => ({ commands }: CommandProps) => commands.setMark(MarkName.STRIKETHROUGH);
export const toggleStrikeCommand = () => ({ commands }: CommandProps) => commands.toggleMark(MarkName.STRIKETHROUGH);
export const unsetStrikeCommand = () => ({ commands }: CommandProps) => commands.unsetMark(MarkName.STRIKETHROUGH);

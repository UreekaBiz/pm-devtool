import { Command } from '@tiptap/core';

import { AttributeType, CommandFunctionType, MarkName } from 'common';

// ********************************************************************************
// NOTE: ambient module to ensure command is TypeScript-registered for TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [MarkName.TEXT_STYLE/*Expected and guaranteed to be unique. (SEE: /notebookEditor/model/node)*/]: {
      setTextStyle: CommandFunctionType<typeof setTextStyleCommand, ReturnType>;
    };
  }
}

// --------------------------------------------------------------------------------
export const setTextStyleCommand = (property: AttributeType, value: string): Command => ({ chain }) =>
  chain().setMark('textStyle', { [property]: value }).run();

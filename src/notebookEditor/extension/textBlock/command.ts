import { CommandProps } from '@tiptap/core';

import { CommandFunctionType, NodeName } from 'common';

// ********************************************************************************
// NOTE: ambient module to ensure command is TypeScript-registered for TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [NodeName.PARAGRAPH/*Expected and guaranteed to be unique. (SEE: /notebookEditor/model/node)*/]: {
      /** Toggle a textBlock */
      setTextBlock: CommandFunctionType<typeof setTextBlockCommand, ReturnType>;
    };
  }
}

// --------------------------------------------------------------------------------
export const setTextBlockCommand = () => ({ state, chain }: CommandProps) => {
  const { selection } = state;
  const { parentOffset } = selection.$anchor,
        from = selection.$anchor.pos - parentOffset,
        to = from + selection.$anchor.parent.nodeSize - 2/*inside the textBlock*/;

  return chain()
          .setTextSelection({ from, to })
          .unsetAllMarks()
          .setNode(NodeName.PARAGRAPH)
          .setTextSelection(to)
        .run();
};

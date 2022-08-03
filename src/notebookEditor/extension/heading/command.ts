import { CommandProps } from '@tiptap/core';

import { createBoldMark, isHeadingLevel, CommandFunctionType, HeadingLevel, NodeName, MarkName, SchemaV1 } from 'common';

import { createMarkHolderJSONNode } from 'notebookEditor/extension/markHolder/util';

// ********************************************************************************
// NOTE: ambient module to ensure command is TypeScript-registered for TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [NodeName.HEADING/*Expected and guaranteed to be unique. (SEE: /notebookEditor/model/node)*/]: {
      setHeading: CommandFunctionType<typeof setHeadingCommand, ReturnType>;
      toggleHeading: CommandFunctionType<typeof toggleHeadingCommand, ReturnType>;
    };
  }
}

// --------------------------------------------------------------------------------
export const setHeadingCommand = (attributes: { level: HeadingLevel; }) => ({ editor, chain }: CommandProps) => {
  if(!isHeadingLevel(attributes.level)) return false/*invalid command, level for heading not supported*/;

  let shouldInsertMarkHolder = editor.state.selection.$anchor.parent.content.size < 1;
  if(shouldInsertMarkHolder) {
    return chain().setNode(NodeName.HEADING, attributes)
                  .insertContent(createMarkHolderJSONNode(editor, [MarkName.BOLD]))
                  .run();
  }/* else -- no need to add MarkHolder */

  return chain().setNode(NodeName.HEADING, attributes)
                .command(applyBoldToHeadingContent)
                .run();
};


export const toggleHeadingCommand = (attributes: { level: HeadingLevel; }) => ({ editor, chain }: CommandProps) => {
  if(!isHeadingLevel(attributes.level)) {
    return false/*invalid command, level for heading not supported*/;
  }/* else -- valid level */

  if(editor.isActive(NodeName.HEADING) && editor.state.selection.$anchor.parent.attrs.level === attributes.level/*is the same heading -- toggle*/) {
    return chain().toggleNode(NodeName.PARAGRAPH, NodeName.HEADING, attributes).run();
  } /* else -- set heading normally */

  let shouldInsertMarkHolder = editor.state.selection.$anchor.parent.content.size < 1;
  if(shouldInsertMarkHolder) {
    return chain().toggleNode(NodeName.HEADING, NodeName.PARAGRAPH, attributes)
                  .insertContent(createMarkHolderJSONNode(editor, [MarkName.BOLD]))
                  .run();
  }/* else -- no need to add MarkHolder */

  return chain().toggleNode(NodeName.HEADING, NodeName.PARAGRAPH, attributes)
                .command(applyBoldToHeadingContent)
                .run();
};

// == Util ========================================================================
// applies the Bold Mark to the whole content of the parent of the selection
const applyBoldToHeadingContent = (props: CommandProps) => {
  const { dispatch,  tr } = props;
  if(!dispatch) return false/*transaction not dispatched*/;
  const currentPos = tr.selection.$anchor.pos,
        offset = tr.selection.$anchor.parentOffset,
        parentPos = currentPos - offset;
  tr.addMark(parentPos, parentPos + tr.selection.$anchor.parent.nodeSize - 2/*account for the start and end of the parent Node*/, createBoldMark(SchemaV1));
  dispatch(tr);
  return true/*transaction dispatched*/;
};

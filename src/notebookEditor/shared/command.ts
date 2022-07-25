import { Editor } from '@tiptap/core';

import { VerticalAlign } from 'common';

import { isNodeSelection } from 'notebookEditor/extension/util/node';

// ********************************************************************************
/**
 * Sets the vertical alignment attribute for a node if it is not currently bottom,
 * or sets it to 'bottom' if the desiredAlignment is the same it already has
 *
 * @param editor The current editor instance
 * @param desiredAlignment The alignment that will be set given the checks the function performs
 * @returns A boolean indicating whether the attribute update was successful or not
 */
export const setVerticalAlign = (editor: Editor, desiredAlignment: VerticalAlign): boolean => {
  const { selection } = editor.state,
    nodePos = selection.$anchor.pos;

  if(!isNodeSelection(selection)) return false/*do not handle*/;
  const nodeName = selection.node.type.name;

  const shouldSetBottom = selection.node.attrs.verticalAlign === desiredAlignment;
  return editor.chain()
               .updateAttributes(nodeName, { verticalAlign: shouldSetBottom ? VerticalAlign.bottom : desiredAlignment })
               .setNodeSelection(nodePos)
               .run();
};

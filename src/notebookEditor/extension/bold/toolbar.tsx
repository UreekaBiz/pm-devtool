import { BiBold } from 'react-icons/bi';

import { isMarkHolderNode, MarkName } from 'common';

import { isNodeSelection } from 'notebookEditor/extension/util/node';
import { ToolItem } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Tool Items ==================================================================
export const markBold: ToolItem = {
  toolType: 'button',
  name: MarkName.BOLD,
  label: MarkName.BOLD,

  icon: <BiBold size={16} />,
  tooltip: 'Bold (⌘ + B)',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.state;
    if(!isNodeSelection(selection)) return false;

    return true;
  },
  shouldShow: (editor, depth) => depth === undefined || editor.state.selection.$anchor.depth === depth/*direct parent*/,
  onClick: (editor) => editor.chain().focus().toggleBold().run(),
  isActive: (editor) => {
    const nodeAtPrevPos = editor.state.selection.$anchor.parent.firstChild;
    if(nodeAtPrevPos && isMarkHolderNode(nodeAtPrevPos)) {
      if(!nodeAtPrevPos.attrs.storedMarks?.some(mark => mark.type.name === MarkName.BOLD)) {
        return false;
      }/* else -- boldMark active in MarkHolder */
      return true;
    }/* else -- return default check */

    return editor.isActive(MarkName.BOLD);
  },
};

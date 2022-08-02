import { BiBold } from 'react-icons/bi';

import { isBoldMark, MarkName } from 'common';

import { handleMarkHolderPresence, getMarkHolder } from 'notebookEditor/extension/markHolder/util';
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
  onClick: (editor) => {
    const markHolder = getMarkHolder(editor);
    if(markHolder) {
      return handleMarkHolderPresence(editor.state.selection, editor.chain, markHolder, editor.schema.marks[MarkName.BOLD]);
    }/* else -- MarkHolder not present, return default action */

    return editor.chain().focus().toggleBold().run();
  },

  isActive: (editor) => {
    const markHolder = getMarkHolder(editor);
    if(markHolder && markHolder.attrs.storedMarks?.some(mark => isBoldMark(mark))) {
      return true;
    }/* else -- return default check */

    return editor.isActive(MarkName.BOLD);
  },
};

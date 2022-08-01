import { BiStrikethrough } from 'react-icons/bi';

import { MarkName } from 'common';

import { handleMarkHolderPresence, isMarkHolderPresent } from 'notebookEditor/extension/markHolder/MarkHolder';
import { isNodeSelection } from 'notebookEditor/extension/util/node';
import { ToolItem } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Tool Items ==================================================================
export const markStrikethrough: ToolItem = {
  toolType: 'button',
  name: MarkName.STRIKETHROUGH,
  label: MarkName.STRIKETHROUGH,

  icon: <BiStrikethrough size={16} />,
  tooltip: 'Strikethrough (⌘ + Shift + X)',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.state;
    if(!isNodeSelection(selection)) return false;

    return true;
  },
  shouldShow: (editor, depth) => depth === undefined || editor.state.selection.$anchor.depth === depth/*direct parent*/,
  onClick: (editor) => {
    const markHolder = isMarkHolderPresent(editor);
    if(markHolder) {
      return handleMarkHolderPresence(editor.state.selection, () => editor.chain(), markHolder, editor.schema.marks[MarkName.STRIKETHROUGH]);
    }/* else -- MarkHolder not present, return default action */

    return editor.chain().focus().toggleStrikethrough().run();
  },

  isActive: (editor) => {
    const markHolder = isMarkHolderPresent(editor);
    if(markHolder && markHolder.attrs.storedMarks?.some(mark => mark.type.name === MarkName.STRIKETHROUGH)) {
      return true;
    }/* else -- return default check */

    return editor.isActive(MarkName.STRIKETHROUGH);
  },
};

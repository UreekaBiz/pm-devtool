import { BiStrikethrough } from 'react-icons/bi';

import { MarkName } from 'common';

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
    if(isNodeSelection(selection)) return true;

    return false;
  },
  shouldShow: (editor, depth) => depth === undefined || editor.state.selection.$anchor.depth === depth/*direct parent*/,
  onClick: (editor) => editor.chain().focus().toggleStrikethrough().run(),
};
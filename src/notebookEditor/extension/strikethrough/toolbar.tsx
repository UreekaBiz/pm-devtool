import { BiStrikethrough } from 'react-icons/bi';

import { isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toggleStrikethroughCommand } from './command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markStrikethrough: ToolItem = {
  toolType: 'button',
  name: MarkName.STRIKETHROUGH,
  label: MarkName.STRIKETHROUGH,

  icon: <BiStrikethrough size={16} />,
  tooltip: 'Strikethrough (⌘ + ⇧ + X)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleStrikethroughCommand),

  isActive: (editor) => {
    if(inMarkHolder(editor,  MarkName.STRIKETHROUGH)) return true/*is active in MarkHolder*/;

    return editor.isNodeOrMarkActive(MarkName.STRIKETHROUGH);
  },
};

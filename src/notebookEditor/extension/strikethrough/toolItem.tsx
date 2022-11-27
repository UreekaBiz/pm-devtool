import { BiStrikethrough } from 'react-icons/bi';

import { isMarkActive, isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

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
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => {
    if(inMarkHolder(editor,  MarkName.STRIKETHROUGH)) return true/*is active in MarkHolder*/;

    return isMarkActive(editor.view.state, MarkName.STRIKETHROUGH);
  },
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleStrikethroughCommand),
};

import { BiBold } from 'react-icons/bi';

import { isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toggleBoldCommand } from './command';
import { isMarkActive } from 'notebookEditor/editor/util';

// ********************************************************************************
// == Tool Items ==================================================================
export const markBold: ToolItem = {
  toolType: 'button',
  name: MarkName.BOLD,
  label: MarkName.BOLD,

  icon: <BiBold size={16} />,
  tooltip: 'Bold (⌘ + B)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleBoldCommand),
  isActive: (editor) => {
    if(inMarkHolder(editor,  MarkName.BOLD)) return true/*is active in MarkHolder*/;

    return isMarkActive(editor, MarkName.BOLD);
  },
};

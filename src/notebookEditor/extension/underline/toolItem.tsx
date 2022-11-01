import { AiOutlineUnderline } from 'react-icons/ai';

import { isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toggleUnderlineCommand } from './command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markUnderline: ToolItem = {
  toolType: 'button',
  name: MarkName.UNDERLINE,
  label: MarkName.UNDERLINE,

  icon: <AiOutlineUnderline size={16} />,
  tooltip: 'Underline (⌘ + U)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  isActive: (editor) => {
    if(inMarkHolder(editor, MarkName.UNDERLINE)) return true/*is active in MarkHolder*/;

    return editor.isNodeOrMarkActive(MarkName.UNDERLINE);
  },
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleUnderlineCommand),
};

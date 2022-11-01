import { BsCodeSlash } from 'react-icons/bs';

import { isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toggleCodeCommand } from './command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markCode: ToolItem = {
  toolType: 'button',
  name: MarkName.CODE,
  label: MarkName.CODE,

  icon: <BsCodeSlash size={16} />,
  tooltip: 'Code (⌘ + E)',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.view.state;
    if(!isNodeSelection(selection)) return false/*do not show*/;

    return true;
  },
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  isActive: (editor) => {
    if(inMarkHolder(editor, MarkName.CODE)) return true/*is active in MarkHolder*/;

    return editor.isNodeOrMarkActive(MarkName.CODE);
  },
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleCodeCommand),
};

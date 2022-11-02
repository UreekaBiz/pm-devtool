import { MdSubscript } from 'react-icons/md';

import { isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toggleSubScriptCommand } from './command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markSubScript: ToolItem = {
  toolType: 'button',
  name: MarkName.SUB_SCRIPT,
  label: MarkName.SUB_SCRIPT,

  icon: <MdSubscript size={16} />,
  tooltip: 'Subscript (⌘ + ,)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  isActive: (editor) => {
    if(inMarkHolder(editor, MarkName.SUB_SCRIPT)) return true/*is active in MarkHolder*/;

    return editor.isNodeOrMarkActive(MarkName.SUB_SCRIPT);
  },
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleSubScriptCommand),
};

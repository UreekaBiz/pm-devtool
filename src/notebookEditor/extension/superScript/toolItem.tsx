import { MdSuperscript } from 'react-icons/md';

import { isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toggleSuperScriptCommand } from './command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markSuperScript: ToolItem = {
  toolType: 'button',
  name: MarkName.SUPER_SCRIPT,
  label: MarkName.SUPER_SCRIPT,

  icon: <MdSuperscript size={16} />,
  tooltip: 'Superscript (⌘ + .)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  isActive: (editor) => {
    if(inMarkHolder(editor, MarkName.SUPER_SCRIPT)) return true/*is active in MarkHolder*/;

    return editor.isNodeOrMarkActive(MarkName.SUPER_SCRIPT);
  },
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleSuperScriptCommand),
};

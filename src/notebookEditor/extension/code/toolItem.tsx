import { BsCodeSlash } from 'react-icons/bs';

import { isMarkActive, isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

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
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => {
    if(inMarkHolder(editor, MarkName.CODE)) return true/*is active in MarkHolder*/;

    return isMarkActive(editor.view.state, MarkName.CODE);
  },
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleCodeCommand),
};

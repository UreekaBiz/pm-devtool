import { AiOutlineItalic } from 'react-icons/ai';

import { isNodeSelection, MarkName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { inMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { toggleItalicCommand } from './command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markItalic: ToolItem = {
  toolType: 'button',
  name: MarkName.ITALIC,
  label: MarkName.ITALIC,

  icon: <AiOutlineItalic size={16} />,
  tooltip: 'Italic (⌘ + I)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => {
    if(inMarkHolder(editor, MarkName.ITALIC)) return true/*is active in MarkHolder*/;

    return editor.isNodeOrMarkActive(MarkName.ITALIC);
  },
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleItalicCommand),
};

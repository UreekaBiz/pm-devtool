import { MdFormatQuote } from 'react-icons/md';

import { getBlockquoteNodeType, isNodeActive, isNodeSelection, toggleWrapCommand, NodeName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { BlockquoteBorderColorToolItem } from './BlockquoteBorderColorToolItem';
import { BlockquoteBorderLeftWidthToolItem } from './BlockquoteBorderLeftWidthToolItem';

// ********************************************************************************
// == Tool Items ==================================================================
export const blockquoteToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.BLOCKQUOTE,
  label: NodeName.BLOCKQUOTE,

  icon: <MdFormatQuote size={16} />,
  tooltip: 'Blockquote (⌘ + ⇧ + B)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => isNodeActive(editor.view.state, NodeName.BLOCKQUOTE),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleWrapCommand(getBlockquoteNodeType(editor.view.state.schema), {/*no attrs*/})),
};

export const blockquoteBorderColorToolItem: ToolItem =  {
  toolType: 'component',
  name: 'blockquoteBorderColorToolItem',

  component: BlockquoteBorderColorToolItem,
};

export const blockquoteBorderLeftWidthToolItem: ToolItem =  {
  toolType: 'component',
  name: 'blockquoteBorderLeftWidthToolItem',

  component: BlockquoteBorderLeftWidthToolItem,
};

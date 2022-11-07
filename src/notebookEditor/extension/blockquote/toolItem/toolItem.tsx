import { MdFormatQuote } from 'react-icons/md';

import { isNodeSelection, NodeName } from 'common';

import { toggleBlock } from 'notebookEditor/command';
import { ToolItem } from 'notebookEditor/toolbar/type';

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
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  isActive: (editor) => editor.isNodeOrMarkActive(NodeName.BLOCKQUOTE),
  onClick: (editor) => toggleBlock(editor, NodeName.BLOCKQUOTE, {/*no attrs*/}),
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

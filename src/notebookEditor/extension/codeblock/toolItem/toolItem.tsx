import { BiCodeAlt } from 'react-icons/bi';

import { generateNodeId, isCodeBlockNode, isNodeActive, AncestorDepth, AttributeType, NodeName } from 'common';

import { toggleBlock } from 'notebookEditor/command/node';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { CodeBlockLanguageToolItem } from './CodeBlockLanguageToolItem';
import { CodeBlockFormatToolItem } from './CodeBlockFormatToolItem';

//*********************************************************************************
// === Tool Items =================================================================
export const codeBlockToolItem: ToolItem = {
  toolType: 'button',

  name: NodeName.CODEBLOCK,
  label: NodeName.CODEBLOCK,

  icon: <BiCodeAlt size={16} />,
  tooltip: 'Code Block (⌘ + ⇧ + C)',

  // Disable tool item if current selected node or its parent is a CodeBlock node
  shouldBeDisabled: (editor) => isNodeActive(editor.view.state, NodeName.CODEBLOCK),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => isNodeActive(editor.view.state, NodeName.CODEBLOCK),
  onClick: (editor) => toggleBlock(editor, NodeName.CODEBLOCK, { [AttributeType.Id]: generateNodeId() }),
};

export const codeBlockLanguageToolItem: ToolItem = {
  toolType: 'component',
  name: 'codeBlockLanguageToolItem',

  component: CodeBlockLanguageToolItem,
  shouldShow: (editor) => isCodeBlockNode(editor.view.state.selection.$from.node(AncestorDepth.GrandParent)),
};

export const codeBlockFormatToolItem: ToolItem = {
  toolType: 'component',
  name: 'codeBlockFormatToolItem',

  component: CodeBlockFormatToolItem,
  shouldShow: (editor) => isCodeBlockNode(editor.view.state.selection.$from.node(AncestorDepth.GrandParent)),
};

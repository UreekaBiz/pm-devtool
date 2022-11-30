import { BiCodeAlt } from 'react-icons/bi';

import { generateNodeId, getParentNode, isCodeBlockNode, AttributeType, NodeName, isNodeActive } from 'common';

import { toggleBlock } from 'notebookEditor/command/node';
import { CheckBoxToolItem } from 'notebookEditor/extension/shared/component/CheckBoxToolItem';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { CodeBlockTypeToolItem } from './CodeBlockTypeToolItem';

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

export const codeBlockTypeToolItem: ToolItem = {
  toolType: 'component',
  name: 'codeBlockTypeToolItem',

  component: CodeBlockTypeToolItem,
  shouldShow: (editor) => isCodeBlockNode(getParentNode(editor.view.state.selection)),
};

export const codeBlockWrapToolItem: ToolItem =  {
  toolType: 'component',
  name: 'codeBlockWrapToolItem',

  component: (props) =>
    <CheckBoxToolItem
      {...props}
      name='Wrap'
      attributeType={AttributeType.Wrap}
      nodeName={NodeName.CODEBLOCK}
    />,

  shouldShow: (editor) => isCodeBlockNode(getParentNode(editor.view.state.selection)),
};

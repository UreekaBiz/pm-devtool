import { BiCodeAlt } from 'react-icons/bi';

import { generateNodeId, getParentNode, getSelectedNode, isCodeBlockNode, isNodeSelection, AttributeType, NodeName } from 'common';

import { CheckBoxToolItem } from 'notebookEditor/extension/shared/component/CheckBoxToolItem';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { toggleBlock } from 'notebookEditor/extension/util';

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
  shouldBeDisabled: (editor) => {
    const node = getSelectedNode(editor.view.state);
    if(node && isCodeBlockNode(node)) return true/*(SEE: comment above)*/;

    if(isCodeBlockNode(editor.view.state.selection.$anchor.parent)) return true/*(SEE: comment above)*/;

    if(isNodeSelection(editor.view.state.selection)) return true/*disabled*/;

    return false/*enabled*/;
  },
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

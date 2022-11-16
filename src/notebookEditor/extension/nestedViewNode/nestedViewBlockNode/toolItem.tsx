import { MdOutlineViewDay } from 'react-icons/md';

import { generateNodeId, getNestedViewBlockNodeType, isNodeSelection, AttributeType, NodeName } from 'common';

import { shouldShowToolItem } from 'notebookEditor/extension/util/ui';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { insertAndSelectNestedViewNode } from '../util';

//*********************************************************************************
// == Tool Items ==================================================================
export const nestedViewBlockNodeToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.NESTED_VIEW_BLOCK_NODE,
  label: NodeName.NESTED_VIEW_BLOCK_NODE,

  icon: <MdOutlineViewDay size={16} />,
  tooltip: 'Nested View Block Node (⌘ + ⇧ + ⌥ +E)',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.view.state;
    if(!isNodeSelection(selection)) return false;

    return true;
  },
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => editor.isNodeOrMarkActive(NodeName.NESTED_VIEW_BLOCK_NODE),
  onClick: (editor, depth) => insertAndSelectNestedViewNode(editor, depth, getNestedViewBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'toolItem'),
};

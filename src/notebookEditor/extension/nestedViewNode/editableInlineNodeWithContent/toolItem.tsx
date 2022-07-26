import { MdCheckBoxOutlineBlank } from 'react-icons/md';

import { generateNodeId, getEditableInlineNodeWithContentNodeType, isNodeActive, isNodeSelection, AttributeType, NodeName } from 'common';

import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { insertAndSelectNestedViewNode } from '../util';

//*********************************************************************************
// == Tool Items ==================================================================
export const editableInlineNodeWithContentToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT,
  label: NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT,

  icon: <MdCheckBoxOutlineBlank size={16} />,
  tooltip: 'Editable Inline Node with Content (⌘ + ⇧ + E)',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.view.state;
    if(!isNodeSelection(selection)) return false;

    return true;
  },
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => isNodeActive(editor.view.state, NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT),
  onClick: (editor, depth) => insertAndSelectNestedViewNode(editor, depth, getEditableInlineNodeWithContentNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId }, 'toolItem'),
};

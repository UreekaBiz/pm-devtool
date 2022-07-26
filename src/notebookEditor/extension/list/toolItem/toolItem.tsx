import { MdFormatListBulleted } from 'react-icons/md';
import { RiListOrdered } from 'react-icons/ri';

import { isNodeSelection, AncestorDepth, AttributeType, NodeName, ORDERED_LIST_DEFAULT_START } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { Editor } from 'notebookEditor/editor/Editor';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { toggleListCommand } from '../command/list/toggle/toggleListCommand';

// ********************************************************************************
// -- Ordered List ----------------------------------------------------------------
export const orderedListToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.ORDERED_LIST,
  label: NodeName.ORDERED_LIST,

  icon: <RiListOrdered size={16} />,
  tooltip: 'Ordered List (⌘ + ⇧ + 7)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => isListToolItemActive(editor, NodeName.ORDERED_LIST),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleListCommand(NodeName.ORDERED_LIST, { [AttributeType.StartValue]: ORDERED_LIST_DEFAULT_START })),
};

// -- Unordered List --------------------------------------------------------------
export const unorderedListToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.UNORDERED_LIST,
  label: NodeName.UNORDERED_LIST,

  icon: <MdFormatListBulleted size={16} />,
  tooltip: 'Unordered List (⌘ + ⇧ + 8)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => isListToolItemActive(editor, NodeName.UNORDERED_LIST),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleListCommand(NodeName.UNORDERED_LIST, {/*no attrs*/})),
};

// -- Util ------------------------------------------------------------------------
const isListToolItemActive = (editor: Editor, nodeName: NodeName) => {
  const { $from } = editor.view.state.selection;
  const grandParent = $from.node(AncestorDepth.GreatGrandParent);
  return grandParent && grandParent.type.name === nodeName;
};

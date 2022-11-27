import { MdHorizontalRule } from 'react-icons/md';

import { isNodeActive, isNodeSelection, NodeName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { insertOrToggleHorizontalRuleCommand } from '../command';
import { HorizontalRuleHeightToolItem } from './HorizontalRuleHeightToolItem';
import { HorizontalRuleColorToolItem } from './HorizontalRuleColorToolItem';

// ********************************************************************************
// == Tool Items ==================================================================
export const horizontalRuleToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.HORIZONTAL_RULE,
  label: NodeName.HORIZONTAL_RULE,

  icon: <MdHorizontalRule size={16} />,
  tooltip: 'Horizontal Rule',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => isNodeActive(editor.view.state, NodeName.HORIZONTAL_RULE),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, insertOrToggleHorizontalRuleCommand),
};

export const horizontalRuleHeightToolItem: ToolItem =  {
  toolType: 'component',
  name: 'horizontalRuleHeightToolItem',

  component: HorizontalRuleHeightToolItem,
};

export const horizontalRuleColorToolItem: ToolItem =  {
  toolType: 'component',
  name: 'horizontalRuleColorToolItem',

  component: HorizontalRuleColorToolItem,
};

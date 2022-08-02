import { FontSizeToolItem } from 'notebookEditor/extension/style/component/FontSizeToolItem';
import { TextColorToolItem } from 'notebookEditor/extension/style/component/TextColorToolItem';
import { TextColorMarkToolItem } from 'notebookEditor/extension/style/component/TextColorMarkToolItem';
import { SpacingToolItem } from 'notebookEditor/extension/style/component/SpacingToolItem';
import { ToolItem } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Tool Items ==================================================================
export const fontSizeToolItem: ToolItem = {
  toolType: 'component',
  name: 'fontSizeToolItem',

  component: FontSizeToolItem,
};

//** Updates the TextColor attribute on the given node. */
// NOTE: Not to be confuse with textColorMarkToolItem that adds a TextStyle mark.
export const textColorToolItem: ToolItem = {
  toolType: 'component',
  name: 'textColorToolItem',

  component: TextColorToolItem,
};

//** Adds a TextStyle mark on the selected text*/
// NOTE: Not to be confuse with textColorToolItem that update the TextColor attribute.
export const textColorMarkToolItem: ToolItem = {
  toolType: 'component',
  name: 'textColorMarkToolItem',

  component: TextColorMarkToolItem,
};

export const spacingToolItem: ToolItem = {
  toolType: 'component',
  name: 'spacingToolItem',

  component: SpacingToolItem,
};

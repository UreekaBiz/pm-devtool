import { FontSizeToolItem } from 'notebookEditor/extension/style/component/FontSizeToolItem';
import { TextColorToolItem } from 'notebookEditor/extension/style/component/TextColorToolItem';
import { TextColorMarkToolItem } from 'notebookEditor/extension/style/component/TextColorMarkToolItem';
import { SpacingToolItem } from 'notebookEditor/extension/style/component/SpacingToolItem';
import { BackgroundColorMarkToolItem } from 'notebookEditor/extension/style/component/BackgroundColorMarkToolItem';
import { ToolItem } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Tool Items ==================================================================
export const fontSizeToolItem: ToolItem = {
  toolType: 'component',
  name: 'fontSizeToolItem',

  component: FontSizeToolItem,
};

//** Updates the Color attribute on the given node. */
// NOTE: Not to be confuse with textColorMarkToolItem that adds a TextStyle Mark.
export const textColorToolItem: ToolItem = {
  toolType: 'component',
  name: 'textColorToolItem',

  component: TextColorToolItem,
};

//** Adds a TextStyle Mark on the selected text*/
// NOTE: Not to be confuse with textColorToolItem that update the Color attribute.
export const textColorMarkToolItem: ToolItem = {
  toolType: 'component',
  name: 'textColorMarkToolItem',

  component: TextColorMarkToolItem,
};

//** Adds a TextStyle Mark on the selected text*/
// NOTE: Not to be confuse with textColorToolItem that update the Color attribute.
export const backgroundColorMarkToolItem: ToolItem = {
  toolType: 'component',
  name: 'backgroundColorMarkToolItem',

  component: BackgroundColorMarkToolItem,
};

export const spacingToolItem: ToolItem = {
  toolType: 'component',
  name: 'spacingToolItem',

  component: SpacingToolItem,
};

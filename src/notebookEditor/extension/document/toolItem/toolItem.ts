import { ToolItem } from 'notebookEditor/toolbar/type';

import { PreviewPublishedNotebookToolItem } from './PreviewPublishedNotebookToolItem';
import { SetThemeToolItem } from './SetThemeToolItem';

//*********************************************************************************
// == Tool Items ==================================================================
export const previewPublishedNotebookToolItem: ToolItem = {
  toolType: 'component',
  name: 'previewPublishedNotebookToolItem',

  component: PreviewPublishedNotebookToolItem,
};

export const setThemeToolItem: ToolItem = {
  toolType: 'component',
  name: 'setThemeToolItem',

  component: SetThemeToolItem,
};

import { isExcalidrawNode, isNodeSelection } from 'common';

import { ToolItem } from 'notebookEditor/toolbar/type';

import { ExcalidrawRectangleToolItem } from './ExcalidrawRectangleToolItem';

//*********************************************************************************
// === Tool Items =================================================================
export const excalidrawRectangleToolItem: ToolItem = {
  toolType: 'component',
  name: 'excalidrawRectangleToolItem',

  component: ExcalidrawRectangleToolItem,
  shouldShow: (editor) => {
    const { selection } = editor.view.state;
    return isNodeSelection(selection) &&  isExcalidrawNode(selection.node);
  },
};

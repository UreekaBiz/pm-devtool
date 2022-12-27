import { TbLetterE } from 'react-icons/tb';

import { isNodeActive, NodeName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

import { insertAndSelectExcalidrawCommand } from './command';

//*********************************************************************************
// === Tool Items =================================================================
export const excalidrawToolItem: ToolItem = {
  toolType: 'button',

  name: NodeName.EXCALIDRAW,
  label: NodeName.EXCALIDRAW,

  icon: <TbLetterE size={16} />,
  tooltip: 'Excalidraw',

  shouldBeDisabled: (editor) => isNodeActive(editor.view.state, NodeName.EXCALIDRAW),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  isActive: (editor) => isNodeActive(editor.view.state, NodeName.EXCALIDRAW),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, insertAndSelectExcalidrawCommand),
};

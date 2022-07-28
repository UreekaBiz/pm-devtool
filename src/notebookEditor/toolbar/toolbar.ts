import { NodeName } from 'common';

import { DocumentToolbar } from 'notebookEditor/extension/document/toolbar';
import { HeadingToolbar } from 'notebookEditor/extension/heading/toolbar';
import { TextBlockToolbar } from 'notebookEditor/extension/textBlock/toolbar';

import { Toolbar } from './type';

// ********************************************************************************
// A collection of Toolbars. Each Node can have its own Toolbar. If it's not defined
// in the collection then nothing will be shown.
const TOOLBAR_MAP: Record<NodeName, Toolbar | null> = {
  [NodeName.DOC]: DocumentToolbar,
  [NodeName.PARAGRAPH]: null/*none*/,
  [NodeName.TEXT]: null/*none*/,
  [NodeName.TEXT_BLOCK]: TextBlockToolbar/*none*/,
  [NodeName.HEADING]: HeadingToolbar,
};

// --------------------------------------------------------------------------------
/**
 * @param nodeName The name of the node whose toolbar is being asked for
 * @returns The corresponding Toolbar for the given Node name
 */
export const getToolbar = (nodeName: NodeName): Toolbar | null => {
  let toolbar = TOOLBAR_MAP[nodeName];
  return toolbar;
};

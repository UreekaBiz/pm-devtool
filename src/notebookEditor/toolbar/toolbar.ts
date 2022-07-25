import { NodeName } from 'common';

import { DocumentToolbar } from 'notebookEditor/extension/document/toolbar';
import { HeadingToolbar } from 'notebookEditor/extension/heading/toolbar';
import { ParagraphToolbar } from 'notebookEditor/extension/paragraph/toolbar';
import { RectangleToolbar } from 'notebookEditor/extension/svg/shape/rectangle/toolbar';
import { SVGToolbar } from 'notebookEditor/extension/svg/toolbar/toolbar';

import { Toolbar } from './type';

// ********************************************************************************
// A collection of toolbars. Each Node can have its own toolbar, if its not defined
// in the collection nothing will be shown.
const TOOLBAR_MAP: Record<NodeName, Toolbar | null> = {
  [NodeName.DOC]: DocumentToolbar,
  [NodeName.HEADING]: HeadingToolbar,
  [NodeName.PARAGRAPH]: ParagraphToolbar,
  [NodeName.RECTANGLE]: RectangleToolbar,
  [NodeName.SVG]: SVGToolbar,
  [NodeName.TEXT]: null/*none*/,
};

/**
 * Gets the corresponding toolbar for a given node
 * @param nodeName The name of the node whose toolbar is being asked for
 * @returns The corresponding toolbar object for the given node name
 */
export const getToolbar = (nodeName: NodeName): Toolbar | null => {
  let toolbar = TOOLBAR_MAP[nodeName];
  return toolbar;
};

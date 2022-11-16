import { isCellNode, isHeaderCellNode, SelectionDepth } from 'common';

import { Editor } from 'notebookEditor/editor';

// ********************************************************************************
/**
 * default behavior for whether or not a ToolItem
 * should be shown in the Toolbar
 */
 export const shouldShowToolItem = (editor: Editor, depth: SelectionDepth, checkInsideOf?: 'table' | 'list') => {
  const { $anchor } = editor.view.state.selection;

  if(checkInsideOf === 'table') {
    const grandParent = $anchor.node(-1/*grandParent Depth*/);
    if(isCellNode(grandParent) || isHeaderCellNode(grandParent)) {
      return true/*inside Cell*/;
    } /* else -- not inside Cell, return default */
  } /* -- else -- not checking for tables, return default */

  return depth === undefined || $anchor.depth === depth/*direct parent*/;
};

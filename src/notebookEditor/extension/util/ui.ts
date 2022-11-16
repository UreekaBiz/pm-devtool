import { SelectionDepth, INLINE_NODE_CONTAINER_CLASS, isCellNode, isHeaderCellNode } from 'common';

import { Editor } from 'notebookEditor/editor';

// ********************************************************************************
/**
 * Creates an inline {@link HTMLSpanElement} with the required
 * attributes that enable it to correctly display an inline node with content
 */
 export const createInlineNodeContainer = (): HTMLSpanElement => {
  const inlineContainer = document.createElement('span');
        inlineContainer.classList.add(INLINE_NODE_CONTAINER_CLASS);
        inlineContainer.setAttribute('contentEditable', 'false');

  // NOTE: the draggable prop in a NodeSpec only refers to when the Node
  //       is not selected (i.e. if selected) it is still draggable. The
  //       following prevent that from happening
        inlineContainer.ondragstart = () => false;
        inlineContainer.ondrop = () => false;
        inlineContainer.draggable = false;

  return inlineContainer;
};

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

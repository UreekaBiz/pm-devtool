import { Node as ProseMirrorNode } from 'prosemirror-model';

import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// NOTE  Attributes and methods that are common to all inline Nodes with Content
//       are located here
// NOTE: All functionality that is common to the inline Nodes with Content
//       themselves is located in the InlineNodeWithContent extension
//       (SEE: src/notebookEditor/extension/inlineNodeWithContent/InlineNodeWithContent.ts)

// -- Node Type -------------------------------------------------------------------
export const isInlineNodeWithContent = (node: ProseMirrorNode<NotebookSchemaType>): boolean => node.isInline && !node.isText;

// == Util ========================================================================
/**
 * Creates an inline {@link HTMLSpanElement} with the required
 * attributes that enable it to correctly display an inline node with content
 */
 export const createInlineNodeContainer = (): HTMLSpanElement => {
  const inlineContainer = document.createElement('span');
        inlineContainer.classList.add(INLINE_NODE_CONTAINER_CLASS);
        inlineContainer.setAttribute('contentEditable', 'false');

  return inlineContainer;
};

// == CSS =========================================================================
const INLINE_NODE_CONTAINER_CLASS = 'inlineNodeContainer';

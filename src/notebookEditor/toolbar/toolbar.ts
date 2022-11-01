import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';

import { camelToTitleCase, MarkName, NodeName } from 'common';

import { previewPublishedNotebookToolItem, setThemeToolItem } from 'notebookEditor/extension/document';

import { Toolbar, ToolItem } from './type';

// ********************************************************************************
// == Node ========================================================================
/** get a {@link Toolbar} for the given {@link ProseMirrorNode} */
export const getNodeToolbar = (node: ProseMirrorNode): Toolbar => {
  return {
    title: camelToTitleCase(node.type.name),
    name: node.type.name as MarkName/*by definition*/,
    toolsCollections: buildNodeToolCollection(node),
  };
};

/**
 * build {@link Toolbar} for the given {@link ProseMirrorNode}
 * based on its characteristics
 */
const buildNodeToolCollection = (node: ProseMirrorNode): ToolItem[][] => {
  const toolItems: ToolItem[][] = [];
  if(node.isTextblock) {
    toolItems.push(TEXT_BLOCK_TOOL_ITEMS);
  } /* else -- not a textBlock */

  if(node.isBlock) {
    toolItems.push(BLOCK_TOOL_ITEMS);
  } /* else -- not a Block */

  toolItems.push(NODE_CREATION_TOOL_ITEMS);

  const uniqueToolItemsObj = UNIQUE_TOOL_ITEMS[node.type.name as NodeName];
  if(uniqueToolItemsObj) {
    const { position } = uniqueToolItemsObj;
    position === 'start' ? toolItems.unshift(uniqueToolItemsObj.items) : toolItems.push(uniqueToolItemsObj.items);
  } /* else -- no unique tool items for this Node */

  return toolItems;
};

// == Mark ========================================================================
/** get a {@link Toolbar} for the given {@link ProseMirrorMark} */
export const getMarkToolbar = (mark: ProseMirrorMark): Toolbar => {
  return {
    title: camelToTitleCase(mark.type.name),
    name: mark.type.name as MarkName/*by definition*/,
    toolsCollections: buildMarkToolCollection(mark),
  };
};

/**
 * build {@link Toolbar} for the given {@link ProseMirrorMark}
 * based on its characteristics
 */
const buildMarkToolCollection = (mark: ProseMirrorMark): ToolItem[][] =>
  [UNIQUE_TOOL_ITEMS[mark.type.name as MarkName/*by definition*/].items];

// == ToolItem ====================================================================
/** {@link ToolItem}s received by Nodes that are TextBlocks */
const TEXT_BLOCK_TOOL_ITEMS: ToolItem[] = [
  // -- Style ---------------------------------------------------------------------

  // -- Mark ----------------------------------------------------------------------

  // -- Inline --------------------------------------------------------------------
];

/** {@link ToolItem}s received by Nodes that are Blocks */
const BLOCK_TOOL_ITEMS: ToolItem[] = [
  // -- Align ---------------------------------------------------------------------

  // -- Format --------------------------------------------------------------------
];

/** {@link ToolItem}s that create new Nodes */
const NODE_CREATION_TOOL_ITEMS: ToolItem[] = [
  // -- Standard ------------------------------------------------------------------

  // -- Custom --------------------------------------------------------------------
];


/**
 * {@link ToolItem}s that should only be received by a specific
 * {@link ProseMirrorNode} or {@link ProseMirrorMark}
 */
const UNIQUE_TOOL_ITEMS: Record<NodeName | MarkName, { position: 'start' | 'end'; items: ToolItem[]; }> = {
  [NodeName.DOC]: {
    position: 'end',
    items: [
      previewPublishedNotebookToolItem,
      setThemeToolItem,
    ],
  },

  [NodeName.HEADING]: { position: 'end', items: [/*none*/] },
  [NodeName.MARK_HOLDER]: { position: 'end', items: [/*none*/] },
  [NodeName.PARAGRAPH]: { position: 'end', items: [/*none*/] },
  [NodeName.TEXT]: { position: 'end', items: [/*none*/] },

  [MarkName.BOLD]: { position: 'end', items: [/*none*/] },
  [MarkName.STRIKETHROUGH]: { position: 'end', items: [/*none*/] },
  [MarkName.TEXT_STYLE]: { position: 'end', items: [/*none*/] },
};

import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';

import { camelToTitleCase, MarkName, NodeName } from 'common';

import { markBold } from 'notebookEditor/extension/bold';
import { previewPublishedNotebookToolItem, setThemeToolItem } from 'notebookEditor/extension/document';
import { headingLevelToolItem } from 'notebookEditor/extension/heading';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough';
import { backgroundColorMarkToolItem, backgroundColorToolItem, fontSizeToolItem, spacingToolItem, textColorMarkToolItem } from 'notebookEditor/extension/textStyle';

import { Toolbar, ToolItem } from './type';

// ********************************************************************************
// == Node ========================================================================
/** get a {@link Toolbar} for the given {@link ProseMirrorNode} */
export const getNodeToolbar = (node: ProseMirrorNode): Toolbar => {
  return {
    title: camelToTitleCase(node.type.name),
    name: node.type.name as MarkName/*by definition*/,
    toolsCollections: buildNodeToolCollections(node),
  };
};

/**
 * build {@link Toolbar} for the given {@link ProseMirrorNode}
 * based on its characteristics
 */
const buildNodeToolCollections = (node: ProseMirrorNode): ToolItem[][] => {
  const toolCollections: ToolItem[][] = [];
  if(node.isTextblock && TEXT_BLOCK_TOOL_ITEMS.length > 0) {
    toolCollections.push(TEXT_BLOCK_TOOL_ITEMS);
  } /* else -- not a TextBlock or no TextBlock ToolItems */

  if(node.isBlock && BLOCK_TOOL_ITEMS.length > 0) {
    toolCollections.push(BLOCK_TOOL_ITEMS);
  } /* else -- not a Block or no Block ToolItems */

  if(NODE_CREATION_TOOL_ITEMS.length > 0) {
    toolCollections.push(NODE_CREATION_TOOL_ITEMS);
  } /* else -- no Node Creation ToolItems */

  const uniqueToolItemsObj = UNIQUE_TOOL_ITEMS[node.type.name as NodeName];
  if(uniqueToolItemsObj && uniqueToolItemsObj.items.length > 0) {
    const { position } = uniqueToolItemsObj;
    position === 'start' ? toolCollections.unshift(uniqueToolItemsObj.items) : toolCollections.push(uniqueToolItemsObj.items);
  } /* else -- no unique tool items for this Node or the ToolItems entry is empty */

  return toolCollections;
};

// == Mark ========================================================================
/** get a {@link Toolbar} for the given {@link ProseMirrorMark} */
export const getMarkToolbar = (mark: ProseMirrorMark): Toolbar | null => {
  const toolCollections = buildMarkToolCollections(mark);
  if(toolCollections.length < 1) return null/*do not show on Toolbar*/;

  return {
    title: camelToTitleCase(mark.type.name),
    name: mark.type.name as MarkName/*by definition*/,
    toolsCollections: buildMarkToolCollections(mark).filter(collection => collection.length > 0/*not empty*/),
  };
};

/**
 * build {@link Toolbar} for the given {@link ProseMirrorMark}
 * based on its characteristics
 */
const buildMarkToolCollections = (mark: ProseMirrorMark): ToolItem[][] => {
  const toolCollections: ToolItem[][] = [];
  const uniqueToolItemsObj = UNIQUE_TOOL_ITEMS[mark.type.name as MarkName/*by definition*/];

  if(uniqueToolItemsObj && uniqueToolItemsObj.items.length > 0) {
    toolCollections.push(uniqueToolItemsObj.items);
  } /* else -- no unique ToolItems for Mark or entry is empty */

  return toolCollections;
};

// == ToolItem ====================================================================
/** {@link ToolItem}s received by Nodes that are TextBlocks */
const TEXT_BLOCK_TOOL_ITEMS: ToolItem[] = [
  // -- Mark ----------------------------------------------------------------------
  markBold,
  markStrikethrough,
  backgroundColorToolItem,

  // -- Style ---------------------------------------------------------------------
  fontSizeToolItem,
  textColorMarkToolItem,
  backgroundColorMarkToolItem,
  spacingToolItem,
];

/** {@link ToolItem}s received by Nodes that are Blocks */
const BLOCK_TOOL_ITEMS: ToolItem[] = [
  // -- Align ---------------------------------------------------------------------
  // currently nothing

  // -- Format --------------------------------------------------------------------
  // currently nothing
];

/** {@link ToolItem}s that create new Nodes */
const NODE_CREATION_TOOL_ITEMS: ToolItem[] = [
  // -- Standard ------------------------------------------------------------------
  headingLevelToolItem,

  // -- Custom --------------------------------------------------------------------
  // currently nothing
];


/**
 * {@link ToolItem}s that should only be added to a specific
 * {@link ProseMirrorNode} or {@link ProseMirrorMark} {@link Toolbar}
 */
const UNIQUE_TOOL_ITEMS: Record<NodeName | MarkName, { position: 'start' | 'end'; items: ToolItem[]; }> = {
  [NodeName.DOC]: {
    position: 'end',
    items: [
      previewPublishedNotebookToolItem,
      setThemeToolItem,
    ],
  },

  [NodeName.HEADING]: { position: 'start', items: [/*none*/] },
  [NodeName.MARK_HOLDER]: { position: 'end', items: [/*none*/] },
  [NodeName.PARAGRAPH]: { position: 'end', items: [/*none*/] },
  [NodeName.TEXT]: { position: 'end', items: [/*none*/] },
  [MarkName.BOLD]: { position: 'end', items: [/*none*/] },
  [MarkName.STRIKETHROUGH]: { position: 'end', items: [/*none*/] },
  [MarkName.TEXT_STYLE]: { position: 'end', items: [/*none*/] },
};

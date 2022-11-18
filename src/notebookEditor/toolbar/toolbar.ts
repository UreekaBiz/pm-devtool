import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';

import { camelToTitleCase, MarkName, NodeName } from 'common';


import { markBold } from 'notebookEditor/extension/bold/toolItem';
import { previewPublishedNotebookToolItem, setThemeToolItem } from 'notebookEditor/extension/document/toolItem';
import { headingLevelToolItem } from 'notebookEditor/extension/heading/toolItem/toolItem';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough/toolItem';
import { backgroundColorToolItem, fontSizeToolItem, textColorMarkToolItem, backgroundColorMarkToolItem, spacingToolItem } from 'notebookEditor/extension/textStyle/toolItem';

import { EditorToolComponentProps, Toolbar, ToolItem } from './type';

// ********************************************************************************
// == Node ========================================================================
/** get a {@link Toolbar} for the given {@link ProseMirrorNode} */
export const getNodeToolbar = (node: ProseMirrorNode): Toolbar => {

  const { toolCollections, rightContent } = buildNodeToolCollections(node);

  return {
    title: camelToTitleCase(node.type.name),
    name: node.type.name as MarkName/*by definition*/,
    toolsCollections: toolCollections,
    rightContent,
  };
};

/**
 * build {@link Toolbar} for the given {@link ProseMirrorNode}
 * based on its characteristics
 */
const buildNodeToolCollections = (node: ProseMirrorNode): { toolCollections: ToolItem[][]; rightContent: React.FC<EditorToolComponentProps> | undefined/*not required by Toolbar*/;  } => {
  const toolCollections: ToolItem[][] = [];
  let rightContent = undefined/*default*/;

  if(node.isTextblock && TEXT_BLOCK_TOOL_ITEMS.length > 0) {
    toolCollections.push(TEXT_BLOCK_TOOL_ITEMS);
  } /* else -- not a TextBlock or no TextBlock ToolItems */

  if(node.isBlock && BLOCK_TOOL_ITEMS.length > 0) {
    toolCollections.push(BLOCK_TOOL_ITEMS);
  } /* else -- not a Block or no Block ToolItems */

  if(!node.type.spec.topNode/*do not add to Document*/ && NODE_CREATION_TOOL_ITEMS.length > 0) {
    toolCollections.push(NODE_CREATION_TOOL_ITEMS);
  } /* else -- no Node Creation ToolItems */

  const uniqueToolItemsObj = UNIQUE_TOOL_ITEMS[node.type.name as NodeName];
  if(uniqueToolItemsObj && uniqueToolItemsObj.items.length > 0) {
    const { position } = uniqueToolItemsObj;
    position === 'start' ? toolCollections.unshift(uniqueToolItemsObj.items) : toolCollections.push(uniqueToolItemsObj.items);
  } /* else -- no unique tool items for this Node or the ToolItems entry is empty */

  if(uniqueToolItemsObj.rightContent) {
    rightContent = uniqueToolItemsObj.rightContent;
  } /* else -- Toolbar does not require right content */

  return { toolCollections, rightContent };
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
 * {@link ProseMirrorNode} or {@link ProseMirrorMark}'s {@link Toolbar}, as
 * well as the rightContent, if any
 *
 * the given position determines whether they appear at the start or at the
 * end of their neighboring default ToolItems
 */
 type UniqueToolItemConfiguration = {
  position: 'start' | 'end';
  items: ToolItem[];
  rightContent?: React.FC<EditorToolComponentProps>;
};
const defaultUniqueToolItemConfiguration: UniqueToolItemConfiguration= { position: 'start', items: [/*none*/] };
const UNIQUE_TOOL_ITEMS: Record<NodeName | MarkName, UniqueToolItemConfiguration> = {
  // -- Node ----------------------------------------------------------------------
  [NodeName.DOC]: {
    position: 'end',
    items: [
      previewPublishedNotebookToolItem,
      setThemeToolItem,
    ],
  },
  [NodeName.HEADING]: defaultUniqueToolItemConfiguration,
  [NodeName.MARK_HOLDER]: defaultUniqueToolItemConfiguration,
  [NodeName.PARAGRAPH]: defaultUniqueToolItemConfiguration,
  [NodeName.TEXT]: defaultUniqueToolItemConfiguration,

  // -- Mark ----------------------------------------------------------------------
  [MarkName.BOLD]: defaultUniqueToolItemConfiguration,
  [MarkName.STRIKETHROUGH]: defaultUniqueToolItemConfiguration,
  [MarkName.TEXT_STYLE]: defaultUniqueToolItemConfiguration,
};

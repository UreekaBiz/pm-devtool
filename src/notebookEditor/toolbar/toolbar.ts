import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';

import { camelToTitleCase, MarkName, NodeName } from 'common';

import { markBold } from 'notebookEditor/extension/bold';
import { blockquoteBorderColorToolItem, blockquoteBorderLeftWidthToolItem, blockquoteToolItem } from 'notebookEditor/extension/blockquote';
import { markCode } from 'notebookEditor/extension/code';
import { codeBlockTypeToolItem, codeBlockWrapToolItem } from 'notebookEditor/codeblock';
import { codeBlockReferenceChipSelector, codeBlockReferenceDelimiterToolItem } from 'notebookEditor/codeBlockReference';
import { previewPublishedNotebookToolItem, setThemeToolItem } from 'notebookEditor/extension/document';
import { headingLevelToolItem } from 'notebookEditor/extension/heading';
import { horizontalRuleColorToolItem, horizontalRuleHeightToolItem, horizontalRuleToolItem } from 'notebookEditor/extension/horizontalRule';
import { imageAltToolItem, imageBorderToolItem, imageHeightToolItem, imageSrcToolItem, imageTitleToolItem, imageWidthToolItem, verticalAlignBottomToolItem, verticalAlignMiddleToolItem, verticalAlignTopToolItem } from 'notebookEditor/extension/image';
import { markItalic } from 'notebookEditor/extension/italic';
import { linkColorToolItem, linkTargetToolItem, linkURLToolItem } from 'notebookEditor/extension/link';
import { editableInlineNodeWithContentToolItem } from 'notebookEditor/extension/nestedViewNode/editableInlineNodeWithContent';
import { nestedViewBlockNodeToolItem } from 'notebookEditor/extension/nestedViewNode/nestedViewBlockNode';
import { markSubScript } from 'notebookEditor/extension/subScript';
import { markSuperScript } from 'notebookEditor/extension/superScript';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough';
import { markUnderline } from 'notebookEditor/extension/underline';
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
  markItalic,
  markUnderline,
  markStrikethrough,
  markSuperScript,
  markSubScript,
  markCode,
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
  blockquoteToolItem,
  horizontalRuleToolItem,

  // -- Custom --------------------------------------------------------------------
  editableInlineNodeWithContentToolItem,
  nestedViewBlockNodeToolItem,
];

/**
 * {@link ToolItem}s that should only be added to a specific
 * {@link ProseMirrorNode} or {@link ProseMirrorMark}'s {@link Toolbar}
 *
 * the given position determines whether they appear at the start or at the
 * end of their neighboring default ToolItems
 */
type UniqueToolItemConfiguration = { position: 'start' | 'end'; items: ToolItem[]; };
const defaultUniqueToolItemConfiguration: UniqueToolItemConfiguration= { position: 'start', items: [/*none*/] };
const UNIQUE_TOOL_ITEMS: Record<NodeName | MarkName, UniqueToolItemConfiguration> = {
  // -- Node ----------------------------------------------------------------------
  [NodeName.BLOCKQUOTE]: {
    position: 'start',
    items: [
      blockquoteBorderColorToolItem,
      blockquoteBorderLeftWidthToolItem,
    ],
  },
  [NodeName.CODEBLOCK]: {
    position: 'start',
    items: [
      codeBlockTypeToolItem,
      codeBlockWrapToolItem,
    ],
  },
  [NodeName.CODEBLOCK_REFERENCE]: {
    position: 'start',
    items: [
      codeBlockReferenceDelimiterToolItem,
      codeBlockReferenceChipSelector,
    ],
  },
  [NodeName.DOC]: {
    position: 'end',
    items: [
      previewPublishedNotebookToolItem,
      setThemeToolItem,
    ],
  },
  [NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT]: defaultUniqueToolItemConfiguration,
  [NodeName.HEADING]: defaultUniqueToolItemConfiguration,
  [NodeName.HORIZONTAL_RULE]: {
    position: 'start',
    items: [
      horizontalRuleColorToolItem,
      horizontalRuleHeightToolItem,
    ],
  },
  [NodeName.IMAGE]: {
    position: 'start',
    items: [
      imageSrcToolItem,
      imageAltToolItem,
      imageTitleToolItem,
      imageWidthToolItem,
      imageHeightToolItem,
      imageBorderToolItem,
      verticalAlignBottomToolItem,
      verticalAlignMiddleToolItem,
      verticalAlignTopToolItem,
    ],
  },
  [NodeName.MARK_HOLDER]: defaultUniqueToolItemConfiguration,
  [NodeName.NESTED_VIEW_BLOCK_NODE]: defaultUniqueToolItemConfiguration,
  [NodeName.PARAGRAPH]: defaultUniqueToolItemConfiguration,
  [NodeName.TEXT]: defaultUniqueToolItemConfiguration,

  // -- Mark ----------------------------------------------------------------------
  [MarkName.BOLD]: defaultUniqueToolItemConfiguration,
  [MarkName.CODE]: defaultUniqueToolItemConfiguration,
  [MarkName.ITALIC]: defaultUniqueToolItemConfiguration,
  [MarkName.LINK]: {
    position: 'end',
    items: [
      linkURLToolItem,
      linkTargetToolItem,
      linkColorToolItem,
    ],
  },
  [MarkName.REPLACED_TEXT_MARK]: defaultUniqueToolItemConfiguration,
  [MarkName.SUB_SCRIPT]: defaultUniqueToolItemConfiguration,
  [MarkName.SUPER_SCRIPT]: defaultUniqueToolItemConfiguration,
  [MarkName.STRIKETHROUGH]: defaultUniqueToolItemConfiguration,
  [MarkName.TEXT_STYLE]: defaultUniqueToolItemConfiguration,
  [MarkName.UNDERLINE]: defaultUniqueToolItemConfiguration,
};

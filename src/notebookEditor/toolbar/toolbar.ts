import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';

import { camelToTitleCase, MarkName, NodeName, SelectionDepth } from 'common';

import { markBold } from 'notebookEditor/extension/bold';
import { blockquoteBorderColorToolItem, blockquoteBorderLeftWidthToolItem, blockquoteToolItem } from 'notebookEditor/extension/blockquote';
import { markCode } from 'notebookEditor/extension/code';
import { codeBlockToolItem, codeBlockTypeToolItem, codeBlockWrapToolItem } from 'notebookEditor/extension/codeblock';
import { codeBlockReferenceChipSelector, codeBlockReferenceDelimiterToolItem, codeBlockReferenceToolItem } from 'notebookEditor/extension/codeBlockReference';
import { demoAsyncNodeChipToolItem, demoAsyncNodeDelayToolItem, demoAsyncNodeToolItem, DemoAsyncNodeExecuteButtons } from 'notebookEditor/extension/demoAsyncNode';
import { demoAsyncNode2DelaySlider, demoAsyncNode2ReplaceTextToolItem, demoAsyncNode2ToolItem, DemoAsyncNode2ExecuteButtons } from 'notebookEditor/extension/demoAsyncNode2';
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
import { cellToolItems, generalTableToolItems, tableToolItem } from 'notebookEditor/extension/table';
import { backgroundColorMarkToolItem, backgroundColorToolItem, fontSizeToolItem, spacingToolItem, textColorMarkToolItem } from 'notebookEditor/extension/textStyle';

import { EditorToolComponentProps, Toolbar, ToolItem } from './type';

// ********************************************************************************
// == Node ========================================================================
/** get a {@link Toolbar} for the given {@link ProseMirrorNode} */
export const getNodeToolbar = (node: ProseMirrorNode, depth: SelectionDepth, selection: Selection): Toolbar => {
  const { toolCollections, rightContent } = buildNodeToolCollections(node, depth, selection);

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
const buildNodeToolCollections = (node: ProseMirrorNode, depth: SelectionDepth, selection: Selection): { toolCollections: ToolItem[][]; rightContent: React.FC<EditorToolComponentProps> | undefined/*not required by Toolbar*/;  } => {
  const toolCollections: ToolItem[][] = [];
  let rightContent = undefined/*default*/;

  if(WRAPPER_NODES.includes(node.type.name as NodeName/*by definition*/)) {
    return { toolCollections, rightContent };
  } /* else -- not a Wrapper Node */

  const negativeDepthChecker = NODES_WITH_SPECIFIC_NEGATIVE_DEPTH[node.type.name as NodeName/*by definition*/];
  if(negativeDepthChecker) {
    const negativeDepth = negativeDepthChecker(selection);

    if(depth !== selection.$anchor.depth - negativeDepth) {
      return { toolCollections, rightContent };
    } /* else -- Node is allowed ot show toolItems at this depth*/
  } /* else -- Node has no specific negative depth checks */

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

// --------------------------------------------------------------------------------
/**
 * Nodes whose only purpose is to wrap other Nodes, and hence should
 * not display any ToolItems in the Toolbar
 */
const WRAPPER_NODES: NodeName[] = [
  NodeName.ROW,
];

/**
 * Nodes that should only display ToolItems when the SelectionDepth equals
 * $anchor.depth minus the number returned from the function
 * specified in this Record
 */
const NODES_WITH_SPECIFIC_NEGATIVE_DEPTH: Partial<Record<NodeName, (selection: Selection) => number>> = {
  // for Nodes inside Tables, the expected order is SelectionDepth - 1 = Cell,
  // SelectionDepth - 2 = Row, SelectionDepth - 3 = Table

  // NOTE: the depth decreases in 1 since a CellSelection starts from the
  //       anchor of the Cell, and not the content inside it (also, remember
  //       that TextNodes do not augment the depth)
  [NodeName.CELL]: (selection) => selection.empty ? 1 : 0,
  [NodeName.HEADER_CELL]: (selection) => selection.empty ? 1 : 0,
  [NodeName.TABLE]: (selection) => selection.empty ? 3 : 2,
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
  tableToolItem,

  // -- Custom --------------------------------------------------------------------
  codeBlockToolItem,
  codeBlockReferenceToolItem,
  demoAsyncNodeToolItem,
  demoAsyncNode2ToolItem,
  editableInlineNodeWithContentToolItem,
  nestedViewBlockNodeToolItem,
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
  [NodeName.BLOCKQUOTE]: {
    position: 'start',
    items: [
      blockquoteBorderColorToolItem,
      blockquoteBorderLeftWidthToolItem,
    ],
  },
  [NodeName.CELL]: {
    position: 'start',
    items: [...cellToolItems],
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
  [NodeName.DEMO_ASYNC_NODE]: {
    position: 'start',
    items: [
      demoAsyncNodeDelayToolItem,
      demoAsyncNodeChipToolItem,
    ],
    rightContent: DemoAsyncNodeExecuteButtons,
  },
  [NodeName.DEMO_ASYNC_NODE_2]: {
    position: 'start',
    items: [
      demoAsyncNode2ReplaceTextToolItem,
      demoAsyncNode2DelaySlider,
  ],
    rightContent: DemoAsyncNode2ExecuteButtons,
  },
  [NodeName.DOC]: {
    position: 'end',
    items: [
      previewPublishedNotebookToolItem,
      setThemeToolItem,
    ],
  },
  [NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT]: defaultUniqueToolItemConfiguration,
  [NodeName.HEADER_CELL]: {
    position: 'start',
    items: [...cellToolItems],
  },
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
  [NodeName.ROW]: defaultUniqueToolItemConfiguration,
  [NodeName.PARAGRAPH]: defaultUniqueToolItemConfiguration,
  [NodeName.TABLE]: {
    position: 'start',
    items: [...generalTableToolItems],
  },
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

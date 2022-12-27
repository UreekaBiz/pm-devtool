import { markBold } from 'notebookEditor/extension/bold/toolItem';
import { blockquoteToolItem } from 'notebookEditor/extension/blockquote/toolItem';
import { markCode } from 'notebookEditor/extension/code/toolItem';
import { codeBlockToolItem } from 'notebookEditor/extension/codeblock/toolItem';
import { codeBlockReferenceToolItem } from 'notebookEditor/extension/codeBlockReference/toolItem';
import { demoAsyncNodeToolItem } from 'notebookEditor/extension/demoAsyncNode/toolItem';
import { demoAsyncNode2ToolItem } from 'notebookEditor/extension/demoAsyncNode2/toolItem';
import { headingLevelToolItem } from 'notebookEditor/extension/heading/toolItem';
import { horizontalRuleToolItem } from 'notebookEditor/extension/horizontalRule/toolItem';
import { markItalic } from 'notebookEditor/extension/italic/toolItem';
import { orderedListToolItem, unorderedListToolItem } from 'notebookEditor/extension/list/toolItem/toolItem';
import { editableInlineNodeWithContentToolItem } from 'notebookEditor/extension/nestedViewNode/editableInlineNodeWithContent/toolItem';
import { excalidrawToolItem } from 'notebookEditor/extension/excalidraw/toolItem';
import { nestedViewBlockNodeToolItem } from 'notebookEditor/extension/nestedViewNode/nestedViewBlockNode/toolItem';
import { markSubScript } from 'notebookEditor/extension/subScript/toolItem';
import { markSuperScript } from 'notebookEditor/extension/superScript/toolItem';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough/toolItem';
import { tableToolItem } from 'notebookEditor/extension/table/toolItem';
import { backgroundColorMarkToolItem, backgroundColorToolItem, fontSizeToolItem, spacingToolItem, textColorMarkToolItem } from 'notebookEditor/extension/textStyle/toolItem';
import { markUnderline } from 'notebookEditor/extension/underline/toolItem';

import { ToolItem } from '../type';

// ********************************************************************************
/** {@link ToolItem}s received by Nodes that are TextBlocks */
export const TEXT_BLOCK_TOOL_ITEMS: ToolItem[] = [
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
export const BLOCK_TOOL_ITEMS: ToolItem[] = [
  // -- Align ---------------------------------------------------------------------
  // currently nothing

  // -- Format --------------------------------------------------------------------
  // currently nothing
];

/** {@link ToolItem}s that create new Nodes */
export const NODE_CREATION_TOOL_ITEMS: ToolItem[] = [
  // -- Standard ------------------------------------------------------------------
  headingLevelToolItem,
  blockquoteToolItem,
  orderedListToolItem,
  unorderedListToolItem,
  horizontalRuleToolItem,
  tableToolItem,

  // -- Custom --------------------------------------------------------------------
  codeBlockToolItem,
  codeBlockReferenceToolItem,
  demoAsyncNodeToolItem,
  demoAsyncNode2ToolItem,
  editableInlineNodeWithContentToolItem,
  excalidrawToolItem,
  nestedViewBlockNodeToolItem,
];


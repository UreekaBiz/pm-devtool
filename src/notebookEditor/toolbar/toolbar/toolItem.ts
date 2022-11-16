import { markBold } from 'notebookEditor/extension/bold';
import { blockquoteToolItem } from 'notebookEditor/extension/blockquote';
import { markCode } from 'notebookEditor/extension/code';
import { codeBlockToolItem } from 'notebookEditor/extension/codeblock';
import { codeBlockReferenceToolItem } from 'notebookEditor/extension/codeBlockReference';
import { demoAsyncNodeToolItem } from 'notebookEditor/extension/demoAsyncNode';
import { demoAsyncNode2ToolItem } from 'notebookEditor/extension/demoAsyncNode2';
import { headingLevelToolItem } from 'notebookEditor/extension/heading';
import { horizontalRuleToolItem } from 'notebookEditor/extension/horizontalRule';
import { markItalic } from 'notebookEditor/extension/italic';
import { editableInlineNodeWithContentToolItem } from 'notebookEditor/extension/nestedViewNode/editableInlineNodeWithContent';
import { nestedViewBlockNodeToolItem } from 'notebookEditor/extension/nestedViewNode/nestedViewBlockNode';
import { markSubScript } from 'notebookEditor/extension/subScript';
import { markSuperScript } from 'notebookEditor/extension/superScript';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough';
import { tableToolItem } from 'notebookEditor/extension/table';
import { backgroundColorMarkToolItem, backgroundColorToolItem, fontSizeToolItem, spacingToolItem, textColorMarkToolItem } from 'notebookEditor/extension/textStyle';
import { markUnderline } from 'notebookEditor/extension/underline';

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


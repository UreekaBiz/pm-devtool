import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

import { BlockquoteNodeSpec } from './extension/blockquote';
import { BoldMarkSpec } from './extension/bold';
import { CodeMarkSpec } from './extension/code';
import { CodeBlockNodeSpec } from './extension/codeBlock';
import { DocumentNodeSpec } from './extension/document';
import { EditableInlineNodeWithContentNodeSpec } from './extension/nestedViewNode/editableInlineNodeWithContent';
import { HeadingNodeSpec } from './extension/heading';
import { HorizontalRuleNodeSpec } from './extension/horizontalRule';
import { ImageNodeSpec } from './extension/image';
import { ItalicMarkSpec } from './extension/italic';
import { LinkMarkSpec } from './extension/link';
import { MarkHolderNodeSpec } from './extension/markHolder';
import { NestedViewBlockNodeSpec } from './extension/nestedViewNode/nestedViewBlockNode';
import { ParagraphNodeSpec } from './extension/paragraph';
import { ReplacedTextMarkMarkSpec } from './extension/replacedTextMark';
import { SubScriptMarkSpec } from './extension/subScript';
import { SuperScriptMarkSpec } from './extension/superScript';
import { StrikethroughMarkSpec } from './extension/strikethrough';
import { TextNodeSpec } from './extension/text';
import { TextStyleMarkSpec } from './extension/textStyle';
import { UnderlineMarkSpec } from './extension/underline';
import { MarkName } from './mark';
import { NodeName } from './node';

// ********************************************************************************
// == NodeSpec ====================================================================
// NOTE: the order of appearance of the Nodes dictates their priority
//       (e.g. since Paragraph is the default Block type, it must appear first)
export const NodeSpecs: Record<NodeName, NodeSpec> = {
  [NodeName.BLOCKQUOTE]: BlockquoteNodeSpec,
  [NodeName.CODEBLOCK]: CodeBlockNodeSpec,
  [NodeName.DOC]: DocumentNodeSpec,
  [NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT]: EditableInlineNodeWithContentNodeSpec,
  [NodeName.HEADING]: HeadingNodeSpec,
  [NodeName.HORIZONTAL_RULE]: HorizontalRuleNodeSpec,
  [NodeName.IMAGE]: ImageNodeSpec,
  [NodeName.PARAGRAPH]: ParagraphNodeSpec,
  [NodeName.MARK_HOLDER]: MarkHolderNodeSpec,
  [NodeName.NESTED_VIEW_BLOCK_NODE]: NestedViewBlockNodeSpec,
  [NodeName.TEXT]: TextNodeSpec,
};

// == MarkSpec ====================================================================
export const MarkSpecs: Record<MarkName, MarkSpec> = {
  [MarkName.BOLD]: BoldMarkSpec,
  [MarkName.CODE]: CodeMarkSpec,
  [MarkName.ITALIC]: ItalicMarkSpec,
  [MarkName.LINK]: LinkMarkSpec,
  [MarkName.REPLACED_TEXT_MARK]: ReplacedTextMarkMarkSpec,
  [MarkName.SUB_SCRIPT]: SubScriptMarkSpec,
  [MarkName.SUPER_SCRIPT]: SuperScriptMarkSpec,
  [MarkName.STRIKETHROUGH]: StrikethroughMarkSpec,
  [MarkName.TEXT_STYLE]: TextStyleMarkSpec,
  [MarkName.UNDERLINE]: UnderlineMarkSpec,
};

// == Schema ======================================================================
/** the schema version of the {@link Notebook}
  *  @see Notebook#schemaVersion */
// NOTE: must be updated when adding breaking changes to the Schema Notebook
export enum NotebookSchemaVersion {
  V1 = 'v1'/*initial version*/,
}

// ................................................................................
// NOTE: this schema must reflect the same Schema that is being used in the Editor
//       itself, otherwise the Editor will not be able to load the Document.
//
//       When adding or removing Nodes, the extensions that are used in the Editor
//       must also be updated to match the new Schema
// SEE: NotebookProvider.ts
export const SchemaV1 = new Schema({
  topNode: NodeName.DOC,

  nodes: NodeSpecs,

  marks: MarkSpecs,
});
export type NotebookSchemaType = typeof SchemaV1;


// == Util ========================================================================
export const getSchema = (schemaVersion: NotebookSchemaVersion): Schema => {
  switch(schemaVersion) {
    case NotebookSchemaVersion.V1: return SchemaV1;

    default: throw new Error(`Notebook schema version '${schemaVersion}' doesn't have a corresponding schema.`)/*no version was found*/;
  }
};

import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

import { BlockquoteNodeSpec } from './extension/blockquote';
import { BoldMarkSpec } from './extension/bold';
import { CodeMarkSpec } from './extension/code';
import { CodeBlockNodeSpec } from './extension/codeBlock';
import { CodeBlockReferenceNodeSpec } from './extension/codeBlockReference';
import { DemoAsyncNodeSpec } from './extension/demoAsyncNode';
import { DemoAsyncNode2Spec } from './extension/demoAsyncNode2';
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
import { TableNodeSpec } from './extension/table/node/table';
import { CellNodeSpec } from './extension/table/node/cell';
import { HeaderCellNodeSpec } from './extension/table/node/headerCell';
import { RowNodeSpec } from './extension/table/node/row';
import { TextNodeSpec } from './extension/text';
import { TextStyleMarkSpec } from './extension/textStyle';
import { UnderlineMarkSpec } from './extension/underline';
import { MarkName } from './mark';
import { NodeName } from './node';

// ********************************************************************************
// == NodeSpec ====================================================================
// NOTE: the order of appearance of the Nodes dictates their priority
//       hence it should match ExtensionPriority for any Nodes or Marks
//       (SEE: ExtensionPriority)
export const NodeSpecs: Record<NodeName, NodeSpec> = {
  // -- priority ordered ----------------------------------------------------------
  [NodeName.PARAGRAPH]: ParagraphNodeSpec,
  [NodeName.TABLE]: TableNodeSpec,
  [NodeName.CODEBLOCK]: CodeBlockNodeSpec,
  [NodeName.DEMO_ASYNC_NODE_2]: DemoAsyncNode2Spec,
  [NodeName.BLOCKQUOTE]: BlockquoteNodeSpec,
  [NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT]: EditableInlineNodeWithContentNodeSpec,
  [NodeName.NESTED_VIEW_BLOCK_NODE]: NestedViewBlockNodeSpec,

  // -- priority does not matter --------------------------------------------------
  [NodeName.CELL]: CellNodeSpec,
  [NodeName.CODEBLOCK_REFERENCE]: CodeBlockReferenceNodeSpec,
  [NodeName.DEMO_ASYNC_NODE]: DemoAsyncNodeSpec,
  [NodeName.DOC]: DocumentNodeSpec,
  [NodeName.HEADER_CELL]: HeaderCellNodeSpec,
  [NodeName.HEADING]: HeadingNodeSpec,
  [NodeName.HORIZONTAL_RULE]: HorizontalRuleNodeSpec,
  [NodeName.IMAGE]: ImageNodeSpec,
  [NodeName.MARK_HOLDER]: MarkHolderNodeSpec,
  [NodeName.ROW]: RowNodeSpec,

  // -- priority at last ----------------------------------------------------------
  [NodeName.TEXT]: TextNodeSpec,
};

// == MarkSpec ====================================================================
export const MarkSpecs: Record<MarkName, MarkSpec> = {
  // -- priority ordered ----------------------------------------------------------
  [MarkName.LINK]: LinkMarkSpec,

  // -- priority does not matter --------------------------------------------------
  [MarkName.BOLD]: BoldMarkSpec,
  [MarkName.CODE]: CodeMarkSpec,
  [MarkName.ITALIC]: ItalicMarkSpec,
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

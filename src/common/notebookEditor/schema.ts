import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

import { HeadingNodeSpec } from './extension/node/heading';
import { DocumentNodeSpec } from './extension/document';
import { MarkHolderNodeSpec } from './extension/node/markHolder';
import { ParagraphNodeSpec } from './extension/node/paragraph';
import { TextNodeSpec } from './extension/node/text';
import { MarkName } from './mark/type';
import { NodeName } from './node/type';

// ********************************************************************************
// == NodeSpec ====================================================================
// NOTE: the order of appearance of the Nodes dictates their priority
//       (e.g. since Paragraph is the default Block type, it must appear first)
export const NodeSpecs: Record<NodeName, NodeSpec> = {
  [NodeName.DOC]: DocumentNodeSpec,
  [NodeName.HEADING]: HeadingNodeSpec,
  [NodeName.PARAGRAPH]: ParagraphNodeSpec,
  [NodeName.MARK_HOLDER]: MarkHolderNodeSpec,
  [NodeName.TEXT]: TextNodeSpec,
};

// == MarkSpec ====================================================================
export const MarkSpecs: Record<MarkName, MarkSpec> = {
  [MarkName.BOLD]: {},
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

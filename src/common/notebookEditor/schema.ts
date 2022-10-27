import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

import { HeadingNodeSpec } from './editor/node/heading';
import { DocumentNodeSpec } from './editor/node/document';
import { MarkHolderNodeSpec } from './editor/node/markHolder';
import { ParagraphNodeSpec } from './editor/node/paragraph';
import { TextNodeSpec } from './editor/node/text';
import { MarkName } from './mark/type';
import { NodeName } from './node/type';

// ********************************************************************************
// == NodeSpec ====================================================================
export const NodeSpecs: Record<NodeName, NodeSpec> = {
  [NodeName.DOC]: DocumentNodeSpec,
  [NodeName.HEADING]: HeadingNodeSpec,
  [NodeName.MARK_HOLDER]: MarkHolderNodeSpec,
  [NodeName.PARAGRAPH]: ParagraphNodeSpec,
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

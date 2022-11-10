import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { JSONNode, NodeName, ProseMirrorNodeContent } from '../../../node/type';
import { NotebookSchemaType } from '../../../schema';
import { TableRole } from '../type';

// ********************************************************************************
// == Attribute ===================================================================
type RowAttributes = {/*currently none*/};

// ================================================================================
// -- Node Spec -------------------------------------------------------------------
export const RowNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  content: `(${NodeName.CELL} | ${NodeName.HEADER_CELL})*`,
  tableRole: TableRole.Row,
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type RowNodeType = ProseMirrorNode & { attrs: RowAttributes; };
export const isRowNode = (node: ProseMirrorNode): node is RowNodeType => node.type.name === NodeName.ROW;

export const getRowNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.ROW];
export const createRowNode = (schema: NotebookSchemaType, attributes?: Partial<RowAttributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getRowNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type RowJSONNodeType = JSONNode<RowAttributes> & { type: NodeName.ROW; };
export const isRowJSONNode = (node: JSONNode): node is RowJSONNodeType => node.type === NodeName.ROW;

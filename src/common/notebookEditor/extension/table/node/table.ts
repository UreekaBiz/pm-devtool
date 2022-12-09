import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec, NodeType, Schema } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../../../attribute';
import { createNodeDataTypeAttribute, NodeRendererSpec } from '../../../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeIdentifier, NodeName, ProseMirrorNodeContent } from '../../../node/type';
import { NotebookSchemaType } from '../../../schema';
import { getCellNodeType } from './cell';
import { getHeaderCellNodeType } from './headerCell';
import { getRowNodeType } from './row';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the MarkSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const TableAttributeSpec = { [AttributeType.Id]: noNodeOrMarkSpecAttributeDefaultValue<NodeIdentifier>() };
export type TableAttributes = AttributesTypeFromNodeSpecAttributes<typeof TableAttributeSpec>;

// ================================================================================
// -- Node Spec -------------------------------------------------------------------
export const TableNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  content: `${NodeName.ROW}+`,
  group: `${NodeGroup.BLOCK}`,

  // .. Attribute .................................................................
  attrs: TableAttributeSpec,

  // .. Misc ......................................................................
  isolating: true,
};

// -- Render Spec -----------------------------------------------------------------
// -- Render Spec -----------------------------------------------------------------
const renderCodeBlockNodeView = (attributes: TableAttributes, content: string) => {
  const id = attributes[AttributeType.Id];

  return `<div class="${TABLE_CONTAINER_CLASS}"><table id=${id} ${createNodeDataTypeAttribute(NodeName.TABLE)}>${content}</table></div>`;
};

export const TableNodeRendererSpec: NodeRendererSpec<TableAttributes> = {
  tag: 'table',

  isNodeViewRenderer: true/*by definition*/,
  renderNodeView: renderCodeBlockNodeView,

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type TableNodeType = ProseMirrorNode & { attrs: TableAttributes; };
export const isTableNode = (node: ProseMirrorNode): node is TableNodeType => node.type.name === NodeName.TABLE;

export const getTableNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.TABLE];
export const createTableNode = (schema: NotebookSchemaType, attributes?: Partial<TableAttributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getTableNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type TableJSONNodeType = JSONNode<TableAttributes> & { type: NodeName.TABLE; };
export const isTableJSONNode = (node: JSONNode): node is TableJSONNodeType => node.type === NodeName.TABLE;

// == Util ========================================================================
export const TABLE_HANDLE_DETECTION_AREA = 5/*px*/;
export const TABLE_DEFAULT_ROWS = 3;
export const TABLE_DEFAULT_COLUMNS = 3;
export const TABLE_DEFAULT_WITH_HEDER_ROW = true;

export const TABLE_CONTAINER_CLASS = 'tableWrapper';

// --------------------------------------------------------------------------------
/**
 * returns the {@link NodeType}s in the given {@link Schema} that are related to
 * Table functionality
 */
export const getTableNodeTypes = (schema: Schema): { [nodeName: string]: NodeType; } => ({
  [NodeName.TABLE]: getTableNodeType(schema),
  [NodeName.ROW]: getRowNodeType(schema),
  [NodeName.HEADER_CELL]: getHeaderCellNodeType(schema),
  [NodeName.CELL]: getCellNodeType(schema),
});

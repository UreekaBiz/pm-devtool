import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../../../attribute';
import { NodeRendererSpec } from '../../../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../../../node/type';
import { NotebookSchemaType } from '../../../schema';
import { TableRole } from '../class';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the MarkSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const HeaderCellAttributeSpec = {
  [AttributeType.ColSpan]: noNodeOrMarkSpecAttributeDefaultValue<number>(),
  [AttributeType.RowSpan]: noNodeOrMarkSpecAttributeDefaultValue<number>(),
  [AttributeType.ColWidth]: noNodeOrMarkSpecAttributeDefaultValue<number[]>(),
};
export type HeaderCellAttributes = AttributesTypeFromNodeSpecAttributes<typeof HeaderCellAttributeSpec>;

// ================================================================================
// -- Node Spec -------------------------------------------------------------------
export const HeaderNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  content: `${NodeGroup.BLOCK}+`,
  tableRole: TableRole.HeaderCell,

  // .. Attribute .................................................................
  attrs: HeaderCellAttributeSpec,

  // .. Misc ......................................................................
  isolating: true,
};

// -- Render Spec -----------------------------------------------------------------
export const HeaderCellNodeRendererSpec: NodeRendererSpec<HeaderCellAttributes> = {
  tag: 'th',

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type HeaderCellNodeType = ProseMirrorNode & { attrs: HeaderCellAttributes; };
export const isHeaderCellNode = (node: ProseMirrorNode): node is HeaderCellNodeType => node.type.name === NodeName.HEADER_CELL;

export const getHeaderCellNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.HEADER_CELL];
export const createHeaderCellNode = (schema: NotebookSchemaType, attributes?: Partial<HeaderCellAttributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getHeaderCellNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type HeaderCellJSONNodeType = JSONNode<HeaderCellAttributes> & { type: NodeName.HEADER_CELL; };
export const isHeaderCellJSONNode = (node: JSONNode): node is HeaderCellJSONNodeType => node.type === NodeName.HEADER_CELL;

// == Util ========================================================================
export const HEADER_ROW_SPAN = 1/*px*/;
export const HEADER_COL_SPAN = 1/*px*/;

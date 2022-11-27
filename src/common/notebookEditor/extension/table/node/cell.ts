import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../../../attribute';
import { NodeRendererSpec } from '../../../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../../../node/type';
import { NotebookSchemaType } from '../../../schema';
import { TableRole } from '../type';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the MarkSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const CellAttributeSpec = {
  [AttributeType.ColSpan]: noNodeOrMarkSpecAttributeDefaultValue<number>(),
  [AttributeType.RowSpan]: noNodeOrMarkSpecAttributeDefaultValue<number>(),
  [AttributeType.ColWidth]: noNodeOrMarkSpecAttributeDefaultValue<number[]>(),
};
export type CellAttributes = AttributesTypeFromNodeSpecAttributes<typeof CellAttributeSpec>;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const CellNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  content: `${NodeGroup.BLOCK}+`,
  tableRole: TableRole.Cell,

  // .. Attribute .................................................................
  attrs: CellAttributeSpec,

  // .. Misc ......................................................................
  isolating: true,
};

// -- Render Spec -----------------------------------------------------------------
export const CellNodeRendererSpec: NodeRendererSpec<CellAttributes> = {
  tag: 'td',

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type CellNodeType = ProseMirrorNode & { attrs: CellAttributes; };
export const isCellNode = (node: ProseMirrorNode): node is CellNodeType => node.type.name === NodeName.CELL;

export const getCellNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.CELL];
export const createCellNode = (schema: NotebookSchemaType, attributes?: Partial<CellAttributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getCellNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type CellJSONNodeType = JSONNode<CellAttributes> & { type: NodeName.CELL; };
export const isCellJSONNode = (node: JSONNode): node is CellJSONNodeType => node.type === NodeName.CELL;

// == Util ========================================================================
export const MIN_CELL_WIDTH = 25/*px*/;
export const CELL_ROW_SPAN = 1/*px*/;
export const CELL_COL_SPAN = 1/*px*/;

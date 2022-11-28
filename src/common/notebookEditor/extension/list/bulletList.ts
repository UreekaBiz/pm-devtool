import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../../attribute';
import { NodeRendererSpec } from '../../htmlRenderer/type';
import { JSONNode, NodeName, NodeGroup, ProseMirrorNodeContent } from '../../node';
import { NotebookSchemaType } from '../../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: This values must have matching types the ones defined in the Extension.
const BulletListAttributeSpec = {
  [AttributeType.MarginLeft]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
};
export type BulletListAttributes = AttributesTypeFromNodeSpecAttributes<typeof BulletListAttributeSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const BulletListNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  content: `(${NodeName.BULLET_LIST} | ${NodeName.ORDERED_LIST} | ${NodeName.LIST_ITEM})+`,
  /**
   * NOTE: preserve the BulletList parent when pasting if possible, BulletList is
   *       an important parent during replace operations
   *       (SEE: ListItem.ts) (SEE: listItemPlugin.ts)
   */
  defining: true/*(SEE: NOTE above)*/,
  group: `${NodeGroup.BLOCK} ${NodeGroup.LIST}`,

  // .. Attribute .................................................................
  attrs: BulletListAttributeSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const BulletListNodeRendererSpec: NodeRendererSpec<BulletListAttributes> = {
  tag: 'ul',

  attributes: {/*use the default renderer on all attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the attributes
export type BulletListNodeType = ProseMirrorNode & { attrs: BulletListAttributes; };
export const isBulletListNode = (node: ProseMirrorNode): node is BulletListNodeType => node.type.name === NodeName.BULLET_LIST;

export const getBulletListNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.BULLET_LIST];
export const createBulletListNode = (schema: NotebookSchemaType, attributes?: Partial<BulletListAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getBulletListNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type BulletListJSONNodeType = JSONNode<BulletListAttributes> & { type: NodeName.BULLET_LIST; };
export const isBulletListJSONNode = (node: JSONNode): node is BulletListJSONNodeType => node.type === NodeName.BULLET_LIST;

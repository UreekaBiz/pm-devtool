import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { AttributesTypeFromNodeSpecAttributes } from '../../attribute';
import { NodeRendererSpec } from '../../htmlRenderer/type';
import { JSONNode, NodeName, NodeGroup, ProseMirrorNodeContent } from '../../node';
import { NotebookSchemaType } from '../../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: This values must have matching types the ones defined in the Extension.
const OrderedListAttributeSpec = {/*currently no attrs*/};
export type OrderedListAttributes = AttributesTypeFromNodeSpecAttributes<typeof OrderedListAttributeSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const OrderedListNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  // NOTE: explicitly only allowing Lists and ListItems
   content: `${NodeGroup.LIST}+`,

  // NOTE: preserve the OrderedList parent when pasting if possible, OrderedList is
  //       an important parent during replace operations
  //       (SEE: ListItem.ts) (SEE: listItemPlugin.ts)
  defining: true/*(SEE: NOTE above)*/,
  group: `${NodeGroup.BLOCK} ${NodeGroup.LIST}`,

  // .. Attribute .................................................................
  attrs: OrderedListAttributeSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const OrderedListNodeRendererSpec: NodeRendererSpec<OrderedListAttributes> = {
  tag: 'div',

  attributes: {/*use the default renderer on all attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the attributes
export type OrderedListNodeType = ProseMirrorNode & { attrs: OrderedListAttributes; };
export const isOrderedListNode = (node: ProseMirrorNode): node is OrderedListNodeType => node.type.name === NodeName.ORDERED_LIST;

export const getOrderedListNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.ORDERED_LIST];
export const createOrderedListNode = (schema: NotebookSchemaType, attributes?: Partial<OrderedListAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getOrderedListNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type OrderedListJSONNodeType = JSONNode<OrderedListAttributes> & { type: NodeName.ORDERED_LIST; };
export const isOrderedListJSONNode = (node: JSONNode): node is OrderedListJSONNodeType => node.type === NodeName.ORDERED_LIST;

// == Constant ====================================================================
export const ORDERED_LIST_DEFAULT_START = 1/*number shown to the left of list*/;

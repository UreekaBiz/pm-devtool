import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { AttributesTypeFromNodeSpecAttributes } from '../../attribute';
import { NodeRendererSpec } from '../../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../../node';
import { NotebookSchemaType } from '../../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: This values must have matching types the ones defined in the Extension.
const UnorderedListAttributeSpec = {/*currently no attrs*/};
export type UnorderedListAttributes = AttributesTypeFromNodeSpecAttributes<typeof UnorderedListAttributeSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const UnorderedListNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  content: `${NodeName.LIST_ITEM}{1}`,
  group: NodeGroup.BLOCK,

  // .. Attribute .................................................................
  attrs: UnorderedListAttributeSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const UnorderedListNodeRendererSpec: NodeRendererSpec<UnorderedListAttributes> = {
  tag: 'ul',

  attributes: {/*use the default renderer on all attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the attributes
export type UnorderedListNodeType = ProseMirrorNode & { attrs: UnorderedListAttributes; };
export const isUnorderedListNode = (node: ProseMirrorNode): node is UnorderedListNodeType => node.type.name === NodeName.UNORDERED_LIST;

export const getUnorderedListNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.UNORDERED_LIST];
export const createUnorderedListNode = (schema: NotebookSchemaType, attributes?: Partial<UnorderedListAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getUnorderedListNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type UnorderedListJSONNodeType = JSONNode<UnorderedListAttributes> & { type: NodeName.UNORDERED_LIST; };
export const isUnorderedListJSONNode = (node: JSONNode): node is UnorderedListJSONNodeType => node.type === NodeName.UNORDERED_LIST;

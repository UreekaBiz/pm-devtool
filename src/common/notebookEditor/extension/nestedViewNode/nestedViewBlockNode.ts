import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../../attribute';
import { NodeRendererSpec } from '../../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeIdentifier, NodeName, ProseMirrorNodeContent } from '../../node';
import { NotebookSchemaType } from '../../schema';
import { createNestedViewNodeRenderedView } from './nestedViewNode';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: This values must have matching types the ones defined in the Extension
const NestedViewBlockNodeAttributeSpec = {
  [AttributeType.Id]: noNodeOrMarkSpecAttributeDefaultValue<NodeIdentifier>(),
};
export type NestedViewBlockNodeAttributes = AttributesTypeFromNodeSpecAttributes<typeof NestedViewBlockNodeAttributeSpec>;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const NestedViewBlockNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  // EINwC's that are pasted or put inside the NVBN will be turned into Text Nodes
  content: `(${NodeName.TEXT}|${NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT})*`,
  group: NodeGroup.BLOCK,
  marks: ''/*no marks allowed inside*/,

  // .. Attribute .................................................................
  attrs: NestedViewBlockNodeAttributeSpec,

  // .. Misc ......................................................................
  atom: true/*this Node counts as a single unit within the View*/,
  code: true/*this Node's content should be treated as code*/,
  draggable: false,
  selectable: true/*this Node can be set as a NodeSelection*/,
};

// -- Render Spec -----------------------------------------------------------------
const renderNestedViewBlockNodeView = (attributes: NestedViewBlockNodeAttributes, content: string) =>
  createNestedViewNodeRenderedView(NodeName.NESTED_VIEW_BLOCK_NODE, content);

export const NestedViewBlockNodeRendererSpec: NodeRendererSpec<NestedViewBlockNodeAttributes> = {
  tag: 'div',

  isNodeViewRenderer: true/*by definition*/,
  renderNodeView: renderNestedViewBlockNodeView,
  attributes: {/*no need to render attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way to ensure the right attributes will be available
//       since PM does not provide a way to specify their type
export type NestedViewBlockNodeType = ProseMirrorNode & { attrs: NestedViewBlockNodeAttributes; };
export const isNestedViewBlockNode = (node: ProseMirrorNode): node is NestedViewBlockNodeType => node.type.name === NodeName.NESTED_VIEW_BLOCK_NODE;

export const getNestedViewBlockNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.NESTED_VIEW_BLOCK_NODE];
export const createNestedViewBlockNode = (schema: NotebookSchemaType, attributes?: Partial<NestedViewBlockNodeAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getNestedViewBlockNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type NestedViewBlockNodeJSONNodeType = JSONNode<NestedViewBlockNodeAttributes> & { type: NodeName.NESTED_VIEW_BLOCK_NODE; };
export const isNestedViewBlockNodeJSONNode = (node: JSONNode): node is NestedViewBlockNodeJSONNodeType => node.type === NodeName.NESTED_VIEW_BLOCK_NODE;

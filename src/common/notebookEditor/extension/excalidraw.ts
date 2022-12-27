import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributesTypeFromNodeSpecAttributes, AttributeType } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const ExcalidrawAttributeSpec = { [AttributeType.Id]: noNodeOrMarkSpecAttributeDefaultValue<string>() };
export type ExcalidrawAttributes = AttributesTypeFromNodeSpecAttributes<typeof ExcalidrawAttributeSpec>;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const ExcalidrawNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  group: `${NodeGroup.INLINE}`,

  // .. Attribute .................................................................
  attrs: ExcalidrawAttributeSpec,

  // .. Misc ......................................................................
  atom: true/*node does not have directly editable content*/,
  draggable: false,
  defining: true/*maintain original node during replace operations if possible*/,
  inline: true,
  leaf: true/*node does not have directly editable content*/,
  selectable: true,
};

// -- Render Spec -----------------------------------------------------------------
export const ExcalidrawNodeRendererSpec: NodeRendererSpec<ExcalidrawAttributes> = {
  tag: 'div',

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type ExcalidrawNodeType = ProseMirrorNode & { attrs: ExcalidrawAttributes; };
export const isExcalidrawNode = (node: ProseMirrorNode): node is ExcalidrawNodeType => node.type.name === NodeName.EXCALIDRAW;

export const getExcalidrawNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.EXCALIDRAW];
export const createExcalidrawNode = (schema: NotebookSchemaType, attributes?: Partial<ExcalidrawAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getExcalidrawNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type ExcalidrawJSONNodeType = JSONNode<ExcalidrawAttributes> & { type: NodeName.EXCALIDRAW; };
export const isExcalidrawJSONNode = (node: JSONNode): node is ExcalidrawJSONNodeType => node.type === NodeName.EXCALIDRAW;

// ================================================================================
export const EXCALIDRAW_WRAPPER_CLASS = 'excalidrawWrapper';

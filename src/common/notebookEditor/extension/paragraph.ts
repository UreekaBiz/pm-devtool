import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../node/type';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the MarkSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const ParagraphAttributesSpec = {
  [AttributeType.BackgroundColor]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.Color]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.FontSize]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
};
export type ParagraphAttributes = AttributesTypeFromNodeSpecAttributes<typeof ParagraphAttributesSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const ParagraphNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  content: `${NodeGroup.INLINE}*`,
  marks: '_'/*all Marks allowed*/,
  group: NodeGroup.BLOCK,

  // .. Attribute .................................................................
  attrs: ParagraphAttributesSpec,

  // .. Misc ......................................................................
  selectable: false/*cannot be set as NodeSelection*/,
};

// -- Render Spec -----------------------------------------------------------------
export const ParagraphNodeRendererSpec: NodeRendererSpec<ParagraphAttributes> = {
  tag: 'div',

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type ParagraphNodeType = ProseMirrorNode & { attrs: ParagraphAttributes; };
export const isParagraphNode = (node: ProseMirrorNode): node is ParagraphNodeType => node.type.name === NodeName.PARAGRAPH;

export const getParagraphNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.PARAGRAPH];
export const createParagraphNode = (schema: NotebookSchemaType, attributes?: Partial<ParagraphAttributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getParagraphNodeType(schema).create(attributes, content, marks);

// // -- JSON Node Type --------------------------------------------------------------
export type ParagraphJSONNodeType = JSONNode<ParagraphAttributes> & { type: NodeName.PARAGRAPH; };
export const isParagraphJSONNode = (node: JSONNode): node is ParagraphJSONNodeType => node.type === NodeName.PARAGRAPH;

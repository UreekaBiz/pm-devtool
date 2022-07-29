import { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: this value must have matching types -- the ones defined in the Extension
const TextBlockAttributesSpec = {
  [AttributeType.FontSize]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.TextColor]: noNodeOrMarkSpecAttributeDefaultValue<string>(),

  [AttributeType.PaddingTop]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.PaddingBottom]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.PaddingLeft]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.PaddingRight]: noNodeOrMarkSpecAttributeDefaultValue<string>(),

  [AttributeType.MarginTop]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.MarginBottom]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.MarginLeft]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.MarginRight]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
};
export type TextBlockAttributes = AttributesTypeFromNodeSpecAttributes<typeof TextBlockAttributesSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const TextBlockNodeSpec: Readonly<NodeSpec> = {
  name: NodeName.TEXT_BLOCK/*expected and guaranteed to be unique*/,

  group: NodeGroup.BLOCK,
  content: `${NodeGroup.INLINE}*`,

  attrs: TextBlockAttributesSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const TextBlockNodeRendererSpec: NodeRendererSpec<TextBlockAttributes> = {
  tag: 'div',

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type TextBlockNodeType = ProseMirrorNode<NotebookSchemaType> & { attrs: TextBlockAttributes; };
export const isTextBlockNode = (node: ProseMirrorNode<NotebookSchemaType>): node is TextBlockNodeType => node.type.name === NodeName.TEXT_BLOCK;

// -- JSON Node Type --------------------------------------------------------------
export type TextBlockJSONNodeType = JSONNode<TextBlockAttributes> & { type: NodeName.TEXT_BLOCK; };
export const isTextBlockJSONNode = (node: JSONNode): node is TextBlockJSONNodeType => node.type === NodeName.TEXT_BLOCK;

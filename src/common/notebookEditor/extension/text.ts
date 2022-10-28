import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName } from '../node/type';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const TextAttributesSpec = {/*no attributes*/};
export type TextAttributes = AttributesTypeFromNodeSpecAttributes<typeof TextAttributesSpec>;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const TextNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  group: NodeGroup.INLINE,
  marks: '_'/*all marks allowed*/,

  // .. Attribute .................................................................
  attrs: TextAttributesSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const TextNodeRendererSpec: NodeRendererSpec = {
  tag: 'span',

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type TextNodeType = ProseMirrorNode & {/*nothing additional*/};

// NOTE: not returning 'is TextNodeType' since there are no additional attributes
//       for Text Nodes and this would make TypeScript
//       infer ProseMirrorNode as 'never'
export const isTextNode = (node: ProseMirrorNode) => node.type.name === NodeName.TEXT;

export const getTextNodeType = (schema: NotebookSchemaType) => schema.marks[NodeName.TEXT];
export const createTextNode = (schema: NotebookSchemaType, text: string, marks?: ProseMirrorMark[]) => schema.text(text, marks);

// -- JSON Node Type --------------------------------------------------------------
export type TextJSONNodeType = JSONNode<TextAttributes> & { type: NodeName.TEXT; };
export const isTextJSONNode = (node: JSONNode): node is TextJSONNodeType => node.type === NodeName.TEXT;

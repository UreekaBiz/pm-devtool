import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: this value must have matching types -- the ones defined in the Extension
const MarkHolderAttributeSpec = {
  [AttributeType.StoredMarks]: noNodeOrMarkSpecAttributeDefaultValue<Mark[]>(),
};
export type MarkHolderAttributes = AttributesTypeFromNodeSpecAttributes<typeof MarkHolderAttributeSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const MarkHolderNodeSpec: Readonly<NodeSpec> = {
  name: NodeName.MARK_HOLDER/*expected and guaranteed to be unique*/,
  group: NodeGroup.INLINE,
  inline: true,
  selectable: false/*do not allow this Node to be set as a NodeSelection*/,
  atom: true/*MarkHolder has no editable Content*/,

  attrs: MarkHolderAttributeSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const MarkHolderNodeRendererSpec: NodeRendererSpec<MarkHolderAttributes> = {
  tag: ''/*MarkHolders are not meant to be rendered*/,

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type MarkHolderNodeType = ProseMirrorNode<NotebookSchemaType> & { attrs: MarkHolderAttributes; };
export const isMarkHolderNode = (node: ProseMirrorNode<NotebookSchemaType>): node is MarkHolderNodeType => node.type.name === NodeName.MARK_HOLDER;

// -- JSON Node Type --------------------------------------------------------------
export type MarkHolderJSONNodeType = JSONNode<MarkHolderAttributes> & { type: NodeName.MARK_HOLDER; };
export const isMarkHolderJSONNode = (node: JSONNode): node is MarkHolderJSONNodeType => node.type === NodeName.MARK_HOLDER;

import { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { JSONNode, NodeGroup, NodeName } from '../node/type';
import { NotebookSchemaType } from '../schema';

import { AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: this value must have matching types -- the ones defined in the Extension
const DocumentAttributesSpec = {/*no attributes*/};
export type DocumentAttributes = AttributesTypeFromNodeSpecAttributes<typeof DocumentAttributesSpec>;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const DocumentNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  name: NodeName.DOC/*expected and guaranteed to be unique*/,
  content: `${NodeGroup.BLOCK}+`,

  // .. Attribute .................................................................
  attrs: DocumentAttributesSpec,

  // .. Misc ......................................................................
  // NOTE: is expected that the Schema using this Node explicitly defines that this
  //       is the top Node
  topNode: true/*it's the Node that will be used as a root for the Document*/,
};

// -- Render Spec -----------------------------------------------------------------
export const DocumentNodeRendererSpec: NodeRendererSpec<DocumentAttributes> = {
  tag: 'div',

  attributes: {/*use the default renderer on all Attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the Attributes
export type DocumentNodeType = ProseMirrorNode & {/*nothing additional*/};
export const isDocumentNode = (node: ProseMirrorNode): node is DocumentNodeType => node.type.name === NodeName.DOC;

export const getDocumentNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.DOC];

// -- JSON Node Type --------------------------------------------------------------
export type DocumentJSONNodeType = JSONNode<DocumentAttributes> & { type: NodeName.DOC; };
export const isDocumentJSONNode = (node: JSONNode): node is DocumentJSONNodeType => node.type === NodeName.DOC;

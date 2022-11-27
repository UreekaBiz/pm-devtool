import { Node as ProseMirrorNode, Mark as ProseMirrorMark, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributesTypeFromNodeSpecAttributes, AttributeType } from '../attribute';
import { createNodeDataTypeAttribute, NodeRendererSpec } from '../htmlRenderer/type';
import { getAllowedMarks } from '../mark';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../node/type';
import { NotebookSchemaType } from '../schema';
import { asyncNodeStatusToColor, createDefaultAsyncNodeAttributes, AsyncNodeAttributeSpec, AsyncNodeStatus } from './asyncNode';
import { CodeBlockHash } from './codeBlock';
import { CodeBlockReference } from './codeBlockReference';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: This values must have matching types the ones defined in the Extension
export const DemoAsyncNodeAttributeSpec = {
  ...AsyncNodeAttributeSpec,

  /** the array of nodeIdentifiers that the async node is listening to */
  [AttributeType.CodeBlockReferences]: noNodeOrMarkSpecAttributeDefaultValue<CodeBlockReference[]>(),

  /** the array of strings containing the hashes of the textContent of each corresponding CodeBlockReference*/
  [AttributeType.CodeBlockHashes]: noNodeOrMarkSpecAttributeDefaultValue<CodeBlockHash[]>(),

  /** the resulting value of the executed function */
  [AttributeType.Text]: noNodeOrMarkSpecAttributeDefaultValue<string>(),

  /** the delay for the execution of the DAN */
  [AttributeType.Delay]: noNodeOrMarkSpecAttributeDefaultValue<number>(),
};
export type DemoAsyncNodeAttributes = AttributesTypeFromNodeSpecAttributes<typeof DemoAsyncNodeAttributeSpec>;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const DemoAsyncNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  marks: getAllowedMarks([/*no Marks allowed for DemoAsyncNode*/]),
  group: NodeGroup.INLINE,

  // .. Attribute .................................................................
  attrs: DemoAsyncNodeAttributeSpec,

  // .. Misc ......................................................................
  atom: true/*node does not have directly editable content*/,
  draggable: false,
  defining: true/*maintain original node during replace operations if possible*/,
  inline: true,
  leaf: true/*node does not have directly editable content*/,
  selectable: true,
};

// -- Render Spec -----------------------------------------------------------------
const renderDemoAsyncNodeView = (attributes: DemoAsyncNodeAttributes) => {
  const id = attributes[AttributeType.Id];
  const status = attributes[AttributeType.Status] ?? AsyncNodeStatus.NEVER_EXECUTED/*default*/;

  // NOTE: must not contain white space, else the renderer has issues
  //       (hence it is a single line below)
  // NOTE: createNodeDataTypeAttribute must be used for all nodeRenderSpecs
  //       that define their own renderNodeView
  return `<span id=${id} ${createNodeDataTypeAttribute(NodeName.DEMO_ASYNC_NODE)}><span>${attributes[AttributeType.Text]}</span><div class="${DEMO_ASYNC_NODE_STATUS_CONTAINER_CLASS}" style="background-color: ${asyncNodeStatusToColor(status)}" /></span>`;
};

export const DemoAsyncNodeRendererSpec: NodeRendererSpec<DemoAsyncNodeAttributes> = {
  tag: 'span',

  isNodeViewRenderer: true/*by definition*/,
  renderNodeView: renderDemoAsyncNodeView,

  attributes: {/*no need to render attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way to ensure the right attributes will be available
//       since PM does not provide a way to specify their type
export type DemoAsyncNodeType = ProseMirrorNode & { attrs: DemoAsyncNodeAttributes; };
export const isDemoAsyncNode = (node: ProseMirrorNode): node is DemoAsyncNodeType => node.type.name === NodeName.DEMO_ASYNC_NODE;

export const getDemoAsyncNodeNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.DEMO_ASYNC_NODE];
export const createDemoAsyncNodeNode = (schema: NotebookSchemaType, attributes?: Partial<DemoAsyncNodeAttributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getDemoAsyncNodeNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type DemoAsyncNodeJSONNodeType = JSONNode<DemoAsyncNodeAttributes> & { type: NodeName.DEMO_ASYNC_NODE; };
export const isDemoAsyncNodeJSONNode = (node: JSONNode): node is DemoAsyncNodeJSONNodeType => node.type === NodeName.DEMO_ASYNC_NODE;

// == Util ========================================================================
export const createDefaultDemoAsyncNodeAttributes = (): Partial<DemoAsyncNodeAttributes> => ({
  ...createDefaultAsyncNodeAttributes(),
  [AttributeType.CodeBlockReferences]: [/*empty*/],
  [AttributeType.CodeBlockHashes]: [/*empty*/],
  [AttributeType.Status]: DEFAULT_DEMO_ASYNC_NODE_STATUS,
  [AttributeType.Delay]: DEFAULT_DEMO_ASYNC_NODE_DELAY,
  [AttributeType.Text]: DEFAULT_DEMO_ASYNC_NODE_TEXT,
});

export const DEFAULT_DEMO_ASYNC_NODE_STATUS = AsyncNodeStatus.NEVER_EXECUTED/*alias*/;
export const DEFAULT_DEMO_ASYNC_NODE_TEXT = 'Not Executed'/*creation default*/;
export const DEFAULT_DEMO_ASYNC_NODE_DELAY = 4000/*ms*/;

// -- CSS -------------------------------------------------------------------------
export const DEMO_ASYNC_NODE_STATUS_CONTAINER_CLASS = 'demoAsyncNodeStatusContainer';

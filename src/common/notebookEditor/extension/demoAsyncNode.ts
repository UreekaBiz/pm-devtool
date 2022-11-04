import { Node as ProseMirrorNode, Mark as ProseMirrorMark, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributesTypeFromNodeSpecAttributes, AttributeType } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { getRenderAttributes } from '../htmlRenderer/attribute';
import { getAllowedMarks } from '../mark';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../node/type';
import { NotebookSchemaType } from '../schema';
import { AsyncNodeAttributeSpec, AsyncNodeStatus, createDefaultAsyncNodeAttributes } from './asyncNode';
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
  name: NodeName.DEMO_ASYNC_NODE,

  marks: getAllowedMarks([/*no Marks allowed for DemoAsyncNode*/]),

  group: NodeGroup.INLINE,
  atom: true/*node does not have directly editable content*/,
  leaf: true/*node does not have directly editable content*/,
  inline: true,
  selectable: true,
  draggable: false,
  defining: true/*maintain original node during replace operations if possible*/,

  attrs: DemoAsyncNodeAttributeSpec,
};

// -- Render Spec -----------------------------------------------------------------
const renderDemoAsyncNodeView = (attributes: DemoAsyncNodeAttributes) => {
  const renderAttributes = getRenderAttributes(NodeName.DEMO_ASYNC_NODE,
                                              { ...attributes, [AttributeType.Delay]: String(attributes[AttributeType.Delay])/*converting to string since required*/, [AttributeType.CodeBlockHashes]: ''/*not needed*/, [AttributeType.CodeBlockReferences]: ''/*not needed*/ },
                                              DemoAsyncNodeRendererSpec,
                                              DemoAsyncNodeSpec);

  // parses the JSX into a static string that can be rendered.
  return '<div ' + renderAttributes + '>' + attributes[AttributeType.Text] + '</div>';
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
export const DEMO_ASYNC_NODE_DATA_TOOLTIP = 'data-attribute-tooltip';
export const DEMO_ASYNC_NODE_STATUS_CONTAINER_CLASS = 'demoAsyncNodeStatusContainer';
export const DEMO_ASYNC_NODE_TOOLTIP_CONTAINER_CLASS = 'demoAsyncNodeTooltipContainer';
export const DEMO_ASYNC_NODE_TOOLTIP_TEXT_CONTAINER_CLASS = 'demoAsyncNodeTooltipTextContainer';

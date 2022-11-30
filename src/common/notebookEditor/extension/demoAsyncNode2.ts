
import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributesTypeFromNodeSpecAttributes, AttributeType } from '../attribute';
import { AsyncNodeAttributeSpec, DEFAULT_ASYNC_NODE_STATUS } from './asyncNode';
// import { getRenderAttributes,  } from '../htmlRenderer/attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
// import { getReactNodeFromJSX } from '../htmlRenderer/jsx';
import { getAllowedMarks, MarkName } from '../mark';
import { NodeName, NodeGroup, ProseMirrorNodeContent, JSONNode } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: This values must have matching types the ones defined in the Extension
export const DemoAsyncNode2AttributeSpec = {
  ...AsyncNodeAttributeSpec,

  [AttributeType.Delay]: noNodeOrMarkSpecAttributeDefaultValue<number>(),

  [AttributeType.TextToReplace]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
};
export type DemoAsyncNode2Attributes = AttributesTypeFromNodeSpecAttributes<typeof DemoAsyncNode2AttributeSpec>;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const DemoAsyncNode2Spec: NodeSpec = {
  // .. Definition ................................................................
  content: `${NodeName.TEXT}*`,
  marks: getAllowedMarks([MarkName.BOLD, MarkName.CODE, MarkName.ITALIC, MarkName.REPLACED_TEXT_MARK, MarkName.STRIKETHROUGH, MarkName.SUB_SCRIPT, MarkName.SUPER_SCRIPT, MarkName.TEXT_STYLE, MarkName.UNDERLINE]),
  group: NodeGroup.BLOCK,

  // .. Attribute .................................................................
  attrs: DemoAsyncNode2AttributeSpec,

  // .. Misc ......................................................................
  allowGapCursor: true,
  defining: true/*important parent node during replace operations, parent of content preserved on replace operations*/,
  selectable: false/*cannot be set as NodeSelection*/,
  whitespace: 'pre'/*preserve newlines*/,
};

// -- Render Spec -----------------------------------------------------------------
const renderDemoAsyncNode2View = (attributes: DemoAsyncNode2Attributes, content: string) => {

  // parses the JSX into a static string that can be rendered.
  return '';
 };

export const DemoAsyncNode2RendererSpec: NodeRendererSpec<DemoAsyncNode2Attributes> = {
  tag: 'div',

  isNodeViewRenderer: true/*by definition*/,
  renderNodeView: renderDemoAsyncNode2View,

  attributes: {/*no need to render attributes*/},
};

export const DEFAULT_DEMO_2_ASYNC_NODE_STATUS = DEFAULT_ASYNC_NODE_STATUS/*alias*/;

export const DEFAULT_DEMO_2_ASYNC_NODE_DELAY = 4000/*ms*/;

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way to ensure the right attributes will be available
//       since PM does not provide a way to specify their type
export type DemoAsyncNode2Type = ProseMirrorNode & { attrs: DemoAsyncNode2Attributes; };
export const isDemoAsyncNode2 = (node: ProseMirrorNode): node is DemoAsyncNode2Type => node.type.name === NodeName.DEMO_ASYNC_NODE_2;

export const getDemoAsyncNode2NodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.DEMO_ASYNC_NODE_2];
export const createDemoAsyncNode2Node = (schema: NotebookSchemaType, attributes?: Partial<DemoAsyncNode2Attributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getDemoAsyncNode2NodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type DemoAsyncNode2JSONNodeType = JSONNode<DemoAsyncNode2Attributes> & { type: NodeName.DEMO_ASYNC_NODE_2; };
export const isDemoAsyncNode2JSONNode = (node: JSONNode): node is DemoAsyncNode2JSONNodeType => node.type === NodeName.DEMO_ASYNC_NODE_2;

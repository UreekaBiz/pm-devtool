import { Mark as ProseMirrorMark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { RendererState } from '../htmlRenderer/state';
import { createNodeDataTypeAttribute, NodeRendererSpec, PROSEMIRROR_TRAILING_BREAK_CLASS } from '../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeIdentifier, NodeName, ProseMirrorNodeContent } from '../node/type';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: This values must have matching types the ones defined in the Extension.
export const CodeBlockAttributesSpec = {
  [AttributeType.Id]: noNodeOrMarkSpecAttributeDefaultValue<NodeIdentifier>(),

  /** the language the CodeBlock contains */
  [AttributeType.Language]: noNodeOrMarkSpecAttributeDefaultValue<string>(),

  /** whether or not the CodeBlock line numbers are shown */
  [AttributeType.Lines]: noNodeOrMarkSpecAttributeDefaultValue<boolean>(),
};
export type CodeBlockAttributes = AttributesTypeFromNodeSpecAttributes<typeof CodeBlockAttributesSpec>;
export const isCodeBlockAttributes = (attrs: any): attrs is CodeBlockAttributes => attrs.id !== undefined && attrs.wrap !== undefined;

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const CodeBlockNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  content: `${NodeName.PARAGRAPH}*`,
  group: NodeGroup.BLOCK,

  // .. Attribute .................................................................
  attrs: CodeBlockAttributesSpec,

  // .. Misc ......................................................................
  defining: true/*important parent node during replace operations, parent of content preserved on replace operations*/,
  selectable: false/*cannot be set as NodeSelection*/,
  whitespace: 'pre'/*preserve newlines*/,
};

// -- Render Spec -----------------------------------------------------------------
const renderCodeBlockNodeView = (attributes: CodeBlockAttributes, content: string, state: RendererState) => {
  const id = attributes[AttributeType.Id];
  const visualId = id ? state[NodeName.CODEBLOCK].visualIds[id] : ''/*no visual id*/;

  // NOTE: must not contain white space, else the renderer has issues
  //       (hence it is a single line below)
  // NOTE: createNodeDataTypeAttribute must be used for all nodeRenderSpecs
  //       that define their own renderNodeView
  return `<div id=${id} ${createNodeDataTypeAttribute(NodeName.CODEBLOCK)} ${DATA_VISUAL_ID}="${visualId}"><div class="${CODEBLOCK_INNER_CONTAINER_CLASS}">${content.length > 0 ? content : `<br class="${PROSEMIRROR_TRAILING_BREAK_CLASS}" />`}</div><div class="${CODEBLOCK_VISUAL_ID_CONTAINER_CLASS}">${visualId}</div></div>`;
};

export const CodeBlockNodeRendererSpec: NodeRendererSpec<CodeBlockAttributes> = {
  tag: 'div',

  isNodeViewRenderer: true/*by definition*/,
  renderNodeView: renderCodeBlockNodeView,

  attributes: {/*no need to render attributes*/},
};

// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way to ensure the right attributes will be available
//       since PM does not provide a way to specify their type
export type CodeBlockNodeType = ProseMirrorNode & { attrs: CodeBlockAttributes; };
export const isCodeBlockNode = (node: ProseMirrorNode): node is CodeBlockNodeType => node.type.name === NodeName.CODEBLOCK;

export const getCodeBlockNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.CODEBLOCK];
export const createCodeBlockNode = (schema: NotebookSchemaType, attributes?: Partial<CodeBlockAttributes>, content?: ProseMirrorNodeContent, marks?: ProseMirrorMark[]) =>
  getCodeBlockNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type CodeBlockJSONNodeType = JSONNode<CodeBlockAttributes> & { type: NodeName.CODEBLOCK; };
export const isCodeBlockJSONNode = (node: JSONNode): node is CodeBlockJSONNodeType => node.type === NodeName.CODEBLOCK;

// == Util ========================================================================
// alias for the hash of the Content of a CodeBlock
export type CodeBlockHash = string;

// the text that gets shown for Chips when the corresponding
// codeBlock gets removed, hence invalidating its visualId
export const REMOVED_CODEBLOCK_VISUALID = 'Removed';

// used as the hash when a CodeBlock is empty
export const EMPTY_CODEBLOCK_HASH = 'EmptyString';

export enum CodeBlockLanguage {
  CSS = 'css',
  HTML = 'html',
  JavaScript = 'javascript',
  TypeScript = 'typescript',
}

export const CODEBLOCK_DEFAULT_LINES = true/*show CodeBlock line numbers by default*/;

// -- CSS -------------------------------------------------------------------------
// the attribute that ensures that VisualId for a CodeBlock appears
// to the right of the CodeBlock (SEE: index.css)
export const DATA_VISUAL_ID = 'data-visualid';

// class of the div that holds the content of the CodeBlock
export const CODEBLOCK_INNER_CONTAINER_CLASS = 'codeBlockInnerContainer';

// class of the div that holds the visualId of the CodeBlock
export const CODEBLOCK_VISUAL_ID_CONTAINER_CLASS = 'codeBlockVisualIdContainer';

// class that controls whether or not the CodeBlock line numbers are shown
export const CODEBLOCK_SHOW_LINES_CLASS = 'showCodeBlockLines';

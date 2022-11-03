import { Mark, Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';
import * as ReactDOMServer from 'react-dom/server';

import { AttributeType } from '../../attribute';
import { getReactNodeFromJSX } from '../../../notebookEditor/htmlRenderer';
import { getRenderAttributes } from '../../htmlRenderer/attribute';
import { RendererState } from '../../htmlRenderer/state';
import { NodeRendererSpec } from '../../htmlRenderer/type';
import { getAllowedMarks, MarkName } from '../../mark';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../../node';
import { NotebookSchemaType } from '../../schema';
import { CodeBlockComponentJSX } from './jsx';
import { CodeBlockAttributes, CodeBlockAttributesSpec } from './attribute';

// ********************************************************************************
// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const CodeBlockNodeSpec: NodeSpec = {
  // .. Definition ................................................................
  content: `${NodeName.TEXT}*`,
  group: NodeGroup.BLOCK,
  marks: getAllowedMarks([MarkName.BOLD, MarkName.CODE, MarkName.ITALIC, MarkName.STRIKETHROUGH, MarkName.SUB_SCRIPT, MarkName.SUPER_SCRIPT, MarkName.TEXT_STYLE, MarkName.UNDERLINE]),

  // .. Attribute .................................................................
  attrs: CodeBlockAttributesSpec,

  // .. Misc ......................................................................
  defining: true/*important parent node during replace operations, parent of content preserved on replace operations*/,
  selectable: false/*cannot be set as NodeSelection*/,
  whitespace: 'pre'/*preserve newlines*/,
};

// -- Render Spec -----------------------------------------------------------------
const renderCodeBlockNodeView = (attributes: CodeBlockAttributes, content: string, state: RendererState) => {
  const id = attributes[AttributeType.Id],
        visualId = id ? state[NodeName.CODEBLOCK].visualIds[id] : ''/*no visual id*/;
  const children = getReactNodeFromJSX(content);
  const renderAttributes = getRenderAttributes(NodeName.CODEBLOCK, { ...attributes, wrap: undefined/*FIXME: Types!*/ }, CodeBlockNodeRendererSpec, CodeBlockNodeSpec);

  // parses the JSX into a static string that can be rendered
  return ReactDOMServer.renderToStaticMarkup(<CodeBlockComponentJSX attrs={attributes} renderAttributes={renderAttributes} visualId={visualId}>{children}</CodeBlockComponentJSX>);
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
export const createCodeBlockNode = (schema: NotebookSchemaType, attributes?: Partial<CodeBlockAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getCodeBlockNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type CodeBlockJSONNodeType = JSONNode<CodeBlockAttributes> & { type: NodeName.CODEBLOCK; };
export const isCodeBlockJSONNode = (node: JSONNode): node is CodeBlockJSONNodeType => node.type === NodeName.CODEBLOCK;

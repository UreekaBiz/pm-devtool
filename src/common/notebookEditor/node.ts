import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';

import { Attributes } from './attribute';
import { JSONMark } from './mark';

// ********************************************************************************
// == Node definition =============================================================
export type NodeIdentifier = string/*alias*/;

/**
 * The type of group that this node belongs to. This is used on the Content field
 * on a NodeSpec.
 */
// NOTE: When using a custom group type it is expected to be defined here with a
//       explicit description on where and why it is used. This is done to help
//       prevent inconsistencies between the content of a node and the Group it
//       belongs to.
export enum NodeGroup {
  BLOCK = 'block',
  INLINE = 'inline',
}

/** Unique identifier for each Node on the schema */
export enum NodeName {
  DOC = 'document',
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  TEXT = 'text',
}
export const getNodeName = (node: ProseMirrorNode) => node.type.name as NodeName;

/** the HTML tag used when rendering the node to the DOM. */
export type NodeTag = string/*alias*/;

// == JSON ========================================================================
/** a JSON representation of a ProseMirror Node */
export type JSONNode<A extends Attributes = {}> = {
  type: NodeName;
  content?: JSONNode[];
  text?: string;

  // Attributes are not required in a node and potentially not be present.
  attrs?: Partial<A>;
  marks?: JSONMark[];
};
/**a stringified version of the content of the node */
export type NodeContent = string/*alias*/;

// --------------------------------------------------------------------------------
export const nodeToJSONNode = (node: ProseMirrorNode) => node.toJSON() as JSONNode;
export const nodeToContent = (node: ProseMirrorNode<Schema>) => JSON.stringify(nodeToJSONNode(node)) as NodeContent;
export const contentToJSONNode = (content: NodeContent) => JSON.parse(content) as JSONNode;
export const contentToNode = (schema: Schema, content?: NodeContent) => content ? ProseMirrorNode.fromJSON(schema, contentToJSONNode(content)) : undefined/*none*/;

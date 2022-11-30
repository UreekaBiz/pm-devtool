import { Node as ProseMirrorNode } from 'prosemirror-model';

import { NodeName } from '../../../notebookEditor/node';

// ********************************************************************************
/** check if the given {@link ProseMirrorNode} is an UnorderedList or OrderedList */
export const isListNode = (node: ProseMirrorNode) => listNodes.has(node.type.name as NodeName/*by definition*/);

/** Nodes that have 'list' in their group property */
export const listNodes = new Set([NodeName.UNORDERED_LIST, NodeName.ORDERED_LIST]);

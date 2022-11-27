import { Node as ProseMirrorNode } from 'prosemirror-model';

import { NodeName } from '../../../notebookEditor/node';

// ********************************************************************************
/** check if the given {@link ProseMirrorNode} is a BulletList or OrderedList */
export const isListNode = (node: ProseMirrorNode) => listNodes.has(node.type.name as NodeName/*by definition*/);

/** Nodes that have 'list' in their group property */
export const listNodes = new Set([NodeName.BULLET_LIST, NodeName.ORDERED_LIST]);

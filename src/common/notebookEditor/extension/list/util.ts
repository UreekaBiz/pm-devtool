import { Node as ProseMirrorNode } from 'prosemirror-model';

import { isBulletListNode } from './bulletList';
import { isOrderedListNode } from './orderedList';

// ********************************************************************************
/** check if the given {@link ProseMirrorNode} is a BulletList or OrderedList */
export const isListNode = (node: ProseMirrorNode ) => isBulletListNode(node) || isOrderedListNode(node);

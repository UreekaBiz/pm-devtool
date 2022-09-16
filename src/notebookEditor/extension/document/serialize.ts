import { NodeName, NotebookSchemaType } from 'common';

import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';

// ********************************************************************************
// REF: https://github.com/ProseMirror/prosemirror-model/blob/eef20c8c6dbf841b1d70859df5d59c21b5108a4f/src/fragment.js#L46

// == Constant ====================================================================
// a Map defining specific Text serialization functions (i.e. how the Node) gets
// pasted into the clipboard for Text only paste) for Nodes, given their NodeName
const customSerializerMap = new Map<NodeName, (node: ProseMirrorNode<NotebookSchemaType>) => string>(/*currently nothing*/);

// == Serialize ===================================================================
// Define how to specifically serialize Nodes of different types to Text, so that
// they get pasted to the clipboard as such. This will only affect their plain
// text paste behavior, since otherwise they will be pasted as Nodes
export const serializeDocumentFragment = (fragment: Fragment) => {
  const blockSeparator = '\n\n'/*default separator*/;
  const leafText = undefined/*do not add anything in between Leaf Nodes by default*/;

  // whether a Block Node in the Fragment is separated by adding a blockSeparator
  let blockSeparated: boolean = true/*default*/;

  // the serialized Text representation of the given Fragment
  let serializedText: string = ''/*default*/;

  const from = 0/*Fragment start*/,
        to = fragment.size;

  fragment.nodesBetween(from, to, (node, pos) => {
    // check if a custom serializer handles this Node
    const customSerializer = customSerializerMap.get(node.type.name as NodeName/*by definition*/);
    if(customSerializer) {
      serializedText += customSerializer(node);
      return false/*do not descend further*/;
    } /* else -- use default serializer behavior */

    if(node.isText) {
      serializedText += node.text?.slice(Math.max(from, pos) - pos, to - pos) || ''/*don't add anything*/;
      blockSeparated = !blockSeparator;
    } else if(node.isLeaf && leafText) {
      serializedText += leafText;
      blockSeparated = !blockSeparator;
    } else if(!blockSeparated && node.isBlock) {
      serializedText += blockSeparator;
      blockSeparated = true;
    } /* else -- keep descending */
    return true;
  }, 0/*start of the Fragment*/);

  return serializedText;
};

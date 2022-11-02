
import { getNodeOutputSpec, ImageNodeSpec, NodeName, DATA_NODE_TYPE, DEFAULT_IMAGE_PARSE_TAG } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { ImageAttrs } from './attribute';
import { ImageStorage } from './nodeView/storage';

// ********************************************************************************
// == Node ========================================================================
export const Image = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.IMAGE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  nodeSpec: {
    ...ImageNodeSpec,

    attrs: ImageAttrs,

    parseDOM: createExtensionParseRules([ { tag: `${DEFAULT_IMAGE_PARSE_TAG}` }, { tag: `span[${DATA_NODE_TYPE}="${NodeName.IMAGE}"]` }], ImageAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, ImageAttrs), true/*is Leaf*/),
  },

  // -- Storage -------------------------------------------------------------------
  storage: new ImageStorage(),

  // -- View ----------------------------------------------------------------------
  // NOTE: NodeViews are supposed to be unique for each Node (based on the id of
  //       the node). This is done to persist the state of the node.
  // addNodeView() {
  //   return ({ editor, node, getPos }) => {
  //     if(!isImageNode(node)) throw new Error(`Unexpected node type (${node.type.name}) while adding CodeBlockNode NodeView.`);
  //     const id = node.attrs[AttributeType.Id];
  //     if(!id) return {}/*invalid id -- no node view returned*/;

  //     const controller = this.storage.getNodeView(id);

  //     // Use existing NodeView, update it and return it.
  //     if(controller) {
  //       controller.updateProps(getPos);
  //       return controller;
  //     } /* else -- controller don't exists */

  //     // Create a new Controller and NodeView
  //     return new ImageController(editor, node, this.storage, getPos);
  //   };
  // },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

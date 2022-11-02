
import { getNodeOutputSpec, isImageNode, AttributeType, ImageNodeSpec, NodeName, DATA_NODE_TYPE, DEFAULT_IMAGE_PARSE_TAG } from 'common';

import { isNodeViewStorage } from 'notebookEditor/model';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { getImageAttrs } from './attribute';
import { ImageController } from './nodeView';
import { ImageStorage } from './nodeView/storage';

// ********************************************************************************
// == Node ========================================================================
export const Image = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.IMAGE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getImageAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...ImageNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([ { tag: `${DEFAULT_IMAGE_PARSE_TAG}` }, { tag: `span[${DATA_NODE_TYPE}="${NodeName.IMAGE}"]` }], getImageAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getImageAttrs(extensionStorage)), true/*is Leaf*/),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new ImageStorage(),

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => {
      if(!isImageNode(node)) throw new Error(`Unexpected Node: (${node.type.name}) while adding Image NodeView.`);
      const id = node.attrs[AttributeType.Id];
      if(!id) throw new Error(`Image does not have an Id when it should by contract.`);

      const storage = editor.storage.get(node.type.name as NodeName/**/);
      if(!storage || !(isNodeViewStorage(storage))) throw new Error(`Image does not have a valid storage Id when it should by contract.`);

      // use existing NodeView, update it and return it
      const controller = storage.getNodeView(id);
      if(controller) {
        controller.updateProps(getPos);
        return controller;
      } /* else -- controller don't exists */

      // create a new Controller and NodeView
      return new ImageController(editor, node, storage as ImageStorage/*by definition*/, getPos);
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

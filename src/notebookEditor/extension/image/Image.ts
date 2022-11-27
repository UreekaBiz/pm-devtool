
import { getNodeOutputSpec, isImageNode, ImageNodeSpec, NodeName, DATA_NODE_TYPE, DEFAULT_IMAGE_PARSE_TAG } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
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
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<ImageController>(editor, node, NodeName.IMAGE, getPos, isImageNode, ImageController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

import { getNodeOutputSpec, isExcalidrawNode, ExcalidrawNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getExcalidrawAttrs } from './attribute';
import './excalidraw.css';
import { ExcalidrawController } from './nodeView/controller';

// ********************************************************************************
// == Node ========================================================================
export const Excalidraw = new NodeExtension({
  name: NodeName.EXCALIDRAW,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getExcalidrawAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...ExcalidrawNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.EXCALIDRAW}"]` }], getExcalidrawAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getExcalidrawAttrs(extensionStorage)), true/*is Leaf*/),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage() { return new NodeViewStorage<ExcalidrawController>(); },

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<ExcalidrawController>(editor, node, NodeName.EXCALIDRAW, getPos, isExcalidrawNode, ExcalidrawController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

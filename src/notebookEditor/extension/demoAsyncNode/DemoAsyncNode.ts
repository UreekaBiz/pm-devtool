import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, isDemoAsyncNode, DemoAsyncNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getDemoAsyncNodeAttrs } from './attribute';
import { insertAndSelectDemoAsyncNodeCommand } from './command';
import './demoAsyncNode.css';
import { DemoAsyncNodeController } from './nodeView/controller';

// ********************************************************************************
// == Node ========================================================================
export const DemoAsyncNode = new NodeExtension({
  name: NodeName.DEMO_ASYNC_NODE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getDemoAsyncNodeAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...DemoAsyncNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `span[${DATA_NODE_TYPE}="${NodeName.DEMO_ASYNC_NODE}"]` }], getDemoAsyncNodeAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getDemoAsyncNodeAttrs(extensionStorage)), true/*is Leaf*/),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage() { return new NodeViewStorage<DemoAsyncNodeController>(); },

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<DemoAsyncNodeController>(editor, node, NodeName.DEMO_ASYNC_NODE, getPos, isDemoAsyncNode, DemoAsyncNodeController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Shift-Mod-d': () => shortcutCommandWrapper(editor, insertAndSelectDemoAsyncNodeCommand),
      'Shift-Mod-D': () => shortcutCommandWrapper(editor, insertAndSelectDemoAsyncNodeCommand),
    }),
  ],
});


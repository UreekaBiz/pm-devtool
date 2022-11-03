import { keymap } from 'prosemirror-keymap';

import { getNestedViewBlockNodeType, generateNodeId, getNodeOutputSpec, isNestedViewBlockNode, AttributeType, NestedViewBlockNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, defineNodeViewBehavior } from 'notebookEditor/extension/type';
import { ExtensionPriority, NodeViewStorage } from 'notebookEditor/model';

import { getNestedViewBlockNodeAttrs } from './attribute';
import { insertAndSelectNestedViewNode } from '../util';
import './nestedViewBlockNode.css';
import { NestedViewBlockNodeController } from './nodeView/controller';

// ********************************************************************************
// == Node ========================================================================
export const NestedViewBlockNode = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.NESTED_VIEW_BLOCK_NODE,
  priority: ExtensionPriority.NESTED_VIEW_BLOCK_NODE,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getNestedViewBlockNodeAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...NestedViewBlockNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.NESTED_VIEW_BLOCK_NODE}"]` }], getNestedViewBlockNodeAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getNestedViewBlockNodeAttrs(extensionStorage))),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new NodeViewStorage<NestedViewBlockNodeController>(),

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<NestedViewBlockNodeController>(editor, node, NodeName.NESTED_VIEW_BLOCK_NODE, getPos, isNestedViewBlockNode, NestedViewBlockNodeController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-Shift-Alt-e': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getNestedViewBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
      'Mod-Shift-Alt-E': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getNestedViewBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
    }),
  ],
});

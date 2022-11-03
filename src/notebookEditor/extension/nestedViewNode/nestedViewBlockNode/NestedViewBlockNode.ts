import { keymap } from 'prosemirror-keymap';

import { getNestedViewBlockNodeType, generateNodeId, getNodeOutputSpec, isNestedViewBlockNode, AttributeType, NestedViewBlockNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';
import { isNodeViewStorage, NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { getNestedViewBlockNodeAttrs } from './attribute';
import { insertAndSelectNestedViewNode } from '../util';
import './nestedViewBlockNode.css';
import { NestedViewBlockNodeController, NestedViewBlockNodeStorageType } from './nodeView/controller';

// ********************************************************************************
// == Node ========================================================================
export const NestedViewBlockNode = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.NESTED_VIEW_BLOCK_NODE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getNestedViewBlockNodeAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...NestedViewBlockNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `span[${DATA_NODE_TYPE}="${NodeName.NESTED_VIEW_BLOCK_NODE}"]` }], getNestedViewBlockNodeAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getNestedViewBlockNodeAttrs(extensionStorage))),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new NodeViewStorage<NestedViewBlockNodeController>(),

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => {
    if(!isNestedViewBlockNode(node)) throw new Error(`Unexpected Node: (${node.type.name}) while adding ${NodeName.NESTED_VIEW_BLOCK_NODE} NodeView.`);

    const id = node.attrs[AttributeType.Id];
    if(!id) throw new Error(`${NodeName.NESTED_VIEW_BLOCK_NODE} does not have an Id when it should by contract.`);

    const storage = editor.storage.get(node.type.name as NodeName/*by definition*/);
    if(!storage || !(isNodeViewStorage<NestedViewBlockNodeStorageType>(storage))) throw new Error(`${NodeName.NESTED_VIEW_BLOCK_NODE} does not have a valid storage when it should by contract.`);

    // use existing NodeView, update it and return it
    const controller = storage.getNodeView(id);
    if(controller) {
      controller.updateProps(getPos);
      return controller;
    } /* else -- controller don't exists */

    // create a new Controller and NodeView
    return new NestedViewBlockNodeController(editor, node, storage, getPos);
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-Alt-e': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getNestedViewBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
      'Mod-Alt-E': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getNestedViewBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
    }),
  ],
});

import { getEditableInlineNodeWithContentNodeType, generateNodeId, getNodeOutputSpec, isEditableInlineNodeWithContentNode, AttributeType, EditableInlineNodeWithContentNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';
import { isNodeViewStorage, NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';
import { keymap } from 'prosemirror-keymap';

import { insertAndSelectNestedViewNode } from '../util';
import { getEditableInlineNodeWithContentAttrs } from './attribute';
import './editableInlineNodeWithContent.css';
import { EditableInlineNodeWithContentController, EditableInlineNodeWithContentStorageType } from './nodeView/controller';

// ********************************************************************************
// == Node ========================================================================
export const EditableInlineNodeWithContent = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getEditableInlineNodeWithContentAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...EditableInlineNodeWithContentNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `span[${DATA_NODE_TYPE}="${NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT}"]` }], getEditableInlineNodeWithContentAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getEditableInlineNodeWithContentAttrs(extensionStorage))),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new NodeViewStorage<EditableInlineNodeWithContentController>(),

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => {
    if(!isEditableInlineNodeWithContentNode(node)) throw new Error(`Unexpected Node: (${node.type.name}) while adding ${NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT} NodeView.`);

    const id = node.attrs[AttributeType.Id];
    if(!id) throw new Error(`${NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT} does not have an Id when it should by contract.`);

    const storage = editor.storage.get(node.type.name as NodeName/**/);
    if(!storage || !(isNodeViewStorage<EditableInlineNodeWithContentStorageType>(storage))) throw new Error(`${NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT} does not have a valid storage when it should by contract.`);

    // use existing NodeView, update it and return it
    const controller = storage.getNodeView(id);
    if(controller) {
      controller.updateProps(getPos);
      return controller;
    } /* else -- controller don't exists */

    // create a new Controller and NodeView
    return new EditableInlineNodeWithContentController(editor, node, storage, getPos);
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
        'Mod-e': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getEditableInlineNodeWithContentNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
        'Mod-E': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getEditableInlineNodeWithContentNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
    }),
  ],
});

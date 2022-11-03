import { getEditableInlineNodeWithContentNodeType, generateNodeId, getNodeOutputSpec, isEditableInlineNodeWithContentNode, AttributeType, EditableInlineNodeWithContentNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY, defineNodeViewBehavior } from 'notebookEditor/extension/type';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';
import { keymap } from 'prosemirror-keymap';

import { insertAndSelectNestedViewNode } from '../util';
import { getEditableInlineNodeWithContentAttrs } from './attribute';
import './editableInlineNodeWithContent.css';
import { EditableInlineNodeWithContentController } from './nodeView/controller';

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
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<EditableInlineNodeWithContentController>(editor, node, NodeName.NESTED_VIEW_BLOCK_NODE, getPos, isEditableInlineNodeWithContentNode, EditableInlineNodeWithContentController),

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

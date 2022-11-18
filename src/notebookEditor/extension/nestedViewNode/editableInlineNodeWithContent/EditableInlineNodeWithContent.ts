import { keymap } from 'prosemirror-keymap';

import { getEditableInlineNodeWithContentNodeType, generateNodeId, getNodeOutputSpec, isEditableInlineNodeWithContentNode, AttributeType, EditableInlineNodeWithContentNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from 'notebookEditor/extension/type/NodeExtension/util';
import { ExtensionPriority } from 'notebookEditor/model';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { insertAndSelectNestedViewNode } from '../util';
import { getEditableInlineNodeWithContentAttrs } from './attribute';
import './editableInlineNodeWithContent.css';
import { EditableInlineNodeWithContentController } from './nodeView/controller';

// ********************************************************************************
// == Node ========================================================================
export const EditableInlineNodeWithContent = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT,
  priority: ExtensionPriority.EDITABLE_INLINE_NODE_WITH_CONTENT,

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
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<EditableInlineNodeWithContentController>(editor, node, NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT, getPos, isEditableInlineNodeWithContentNode, EditableInlineNodeWithContentController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-Shift-e': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getEditableInlineNodeWithContentNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
      'Mod-Shift-E': () => insertAndSelectNestedViewNode(editor, editor.view.state.selection.$anchor.depth, getEditableInlineNodeWithContentNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() }, 'keyboardShortcut'),
    }),
  ],
});

import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, isCodeBlockReferenceNode, CodeBlockReferenceNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getCodeBlockReferenceAttrs } from './attribute';
import './codeBlockReference.css';
import { insertAndSelectCodeBlockReferenceCommand } from './command';
import { CodeBlockReferenceController } from './nodeView';

// ********************************************************************************
// == Node ========================================================================
export const CodeBlockReference = new NodeExtension({
  name: NodeName.CODEBLOCK_REFERENCE,
  priority: DEFAULT_EXTENSION_PRIORITY,
  ...CodeBlockReferenceNodeSpec,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getCodeBlockReferenceAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...CodeBlockReferenceNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `span[${DATA_NODE_TYPE}="${NodeName.CODEBLOCK_REFERENCE}"]` }], getCodeBlockReferenceAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getCodeBlockReferenceAttrs(extensionStorage)), true/*is Leaf*/),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new NodeViewStorage<CodeBlockReferenceController>(),

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<CodeBlockReferenceController>(editor, node, NodeName.CODEBLOCK_REFERENCE, getPos, isCodeBlockReferenceNode, CodeBlockReferenceController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor, extensionStorage) => [
    keymap({
      // insert and select a CodeBlockReference
      'Shift-Alt-Mod-c': () => shortcutCommandWrapper(editor, insertAndSelectCodeBlockReferenceCommand),
      'Shift-Alt-Mod-C': () => shortcutCommandWrapper(editor, insertAndSelectCodeBlockReferenceCommand),
    }),
  ],
});


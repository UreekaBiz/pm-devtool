import { keymap } from 'prosemirror-keymap';

import { getBlockquoteNodeType, getNodeOutputSpec, BlockquoteNodeSpec, NodeName, DATA_NODE_TYPE, toggleWrapCommand } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model/type';
import { createWrappingInputRule } from 'notebookEditor/plugin/inputRule/inputRuleBuilders';

import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { BlockquoteAttrs } from './attribute';
import './blockquote.css';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/extension-blockquote/src/blockquote.ts
export const blockquoteRegex = /^\s*>\s$/;

// == Node ========================================================================
export const Blockquote = new NodeExtension({
  name: NodeName.BLOCKQUOTE,
  priority: ExtensionPriority.BLOCKQUOTE,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => BlockquoteAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...BlockquoteNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `blockquote[${DATA_NODE_TYPE}="${NodeName.BLOCKQUOTE}"]` }, { tag: 'blockquote' }], BlockquoteAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, BlockquoteAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createWrappingInputRule(blockquoteRegex, getBlockquoteNodeType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      // Toggle Blockquote
      'Mod-Shift-b': () => shortcutCommandWrapper(editor, toggleWrapCommand(getBlockquoteNodeType(editor.view.state.schema), {/*no attrs*/})),
      'Mod-Shift-B': () => shortcutCommandWrapper(editor, toggleWrapCommand(getBlockquoteNodeType(editor.view.state.schema), {/*no attrs*/})),
    }),
  ],
});


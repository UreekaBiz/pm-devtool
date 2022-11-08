import { keymap } from 'prosemirror-keymap';

import { getBlockquoteNodeType, getNodeOutputSpec, BlockquoteNodeSpec, NodeName, DATA_NODE_TYPE, toggleWrapCommand } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command';
import { ExtensionPriority } from 'notebookEditor/model/type';
import {  createWrappingInputRule } from 'notebookEditor/plugin/inputRule';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension } from '../type';
import { BlockquoteAttrs } from './attribute';
import './blockquote.css';

// ********************************************************************************
// == RegEx =======================================================================
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


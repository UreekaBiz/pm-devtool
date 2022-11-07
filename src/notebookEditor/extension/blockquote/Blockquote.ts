import { keymap } from 'prosemirror-keymap';

import { getBlockquoteNodeType, getNodeOutputSpec, insertNewlineCommand, leaveBlockNodeCommand, selectBlockNodeContentCommand, BlockquoteNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { blockBackspaceCommand, blockModBackspaceCommand, blockArrowUpCommand, blockArrowDownCommand, shortcutCommandWrapper, toggleBlock } from 'notebookEditor/command';
import { ExtensionPriority } from 'notebookEditor/model/type';
import {  InputRule } from 'notebookEditor/plugin/inputRule';

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
  inputRules: (editor) => [new InputRule(blockquoteRegex, (state, match, start, end) => {
    const tr = state.tr.delete(start, end)/*remove matched '>'*/;

    const $start = tr.doc.resolve(start);
    const range = $start.blockRange();
    if(!range) return null/*nothing to do*/;

    return tr.setBlockType(range.$from.pos, range.$to.pos, getBlockquoteNodeType(editor.view.state.schema));
  })],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      // Toggle Blockquote
      'Mod-Shift-b': () => toggleBlock(editor, NodeName.BLOCKQUOTE, {/*no attrs*/ }),
      'Mod-Shift-B': () => toggleBlock(editor, NodeName.BLOCKQUOTE, {/*no attrs*/ }),

      // remove Blockquote when at start of document or Blockquote is empty
      'Backspace': () => shortcutCommandWrapper(editor, blockBackspaceCommand(NodeName.BLOCKQUOTE)),

      // maintain expected Mod-Backspace behavior
      'Mod-Backspace': () => shortcutCommandWrapper(editor, blockModBackspaceCommand(NodeName.BLOCKQUOTE)),

      // set GapCursor if necessary
      'ArrowUp': () => shortcutCommandWrapper(editor, blockArrowUpCommand(NodeName.BLOCKQUOTE)),
      'ArrowDown': () => shortcutCommandWrapper(editor, blockArrowDownCommand(NodeName.BLOCKQUOTE)),

      // insert a newline on Enter
      'Enter': () => shortcutCommandWrapper(editor, insertNewlineCommand(NodeName.BLOCKQUOTE)),

      // exit Node on Shift-Enter
      'Shift-Enter': () => shortcutCommandWrapper(editor, leaveBlockNodeCommand(NodeName.BLOCKQUOTE)),

      // select all the content of the Blockquote
      'Cmd-a': () => shortcutCommandWrapper(editor, selectBlockNodeContentCommand(NodeName.BLOCKQUOTE)),
      'Cmd-A': () => shortcutCommandWrapper(editor, selectBlockNodeContentCommand(NodeName.BLOCKQUOTE)),
    }),
  ],
});


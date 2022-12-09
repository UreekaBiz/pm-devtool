import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { getCodeBlockNodeType, getNodeOutputSpec, isCodeBlockNode, CodeBlockNodeSpec, NodeName, DATA_NODE_TYPE, toggleWrapCommand, AttributeType, generateNodeId } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model';

import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getCodeBlockAttrs } from './attribute';
import './codeBlock.css';
import 'highlight.js/styles/github.css';
import { CodeBlockStorage, CodeBlockController } from './nodeView';
import { codeBlockOnTransaction } from './transaction';
import { codeBlockPlugin } from './plugin';

// ********************************************************************************
// == Constant ====================================================================
const codeBlockRegEx = /```([a-z]+)?[\s\n]$/;

// == Node ========================================================================
export const CodeBlock = new NodeExtension({
  name: NodeName.CODEBLOCK,
  priority: ExtensionPriority.CODEBLOCK,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getCodeBlockAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...CodeBlockNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.CODEBLOCK}"]`, preserveWhitespace: 'full'/*preserve new lines when parsing the content of the codeBlock*/ }], getCodeBlockAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getCodeBlockAttrs(extensionStorage))),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new CodeBlockStorage(),

  // -- Transaction ---------------------------------------------------------------
  transactionListener: (editor, tr) => codeBlockOnTransaction(editor, tr),

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<CodeBlockController>(editor, node, NodeName.CODEBLOCK, getPos, isCodeBlockNode, CodeBlockController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [textblockTypeInputRule(codeBlockRegEx, getCodeBlockNodeType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      // Toggle CodeBlock
      'Mod-Shift-c': () => shortcutCommandWrapper(editor, toggleWrapCommand(getCodeBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() })),
      'Mod-Shift-C': () => shortcutCommandWrapper(editor, toggleWrapCommand(getCodeBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() })),
    }),

    codeBlockPlugin(),
  ],
});

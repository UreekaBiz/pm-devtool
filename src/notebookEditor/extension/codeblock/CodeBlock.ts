import { splitBlockKeepMarks } from 'prosemirror-commands';
import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { getCodeBlockNodeType, generateNodeId, getNodeOutputSpec, isCodeBlockNode, toggleWrapCommand, AttributeType, CodeBlockNodeSpec, NodeName, DATA_NODE_TYPE, AncestorDepth } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model';

import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getCodeBlockAttrs } from './attribute';
import './codeBlock.css';
import { codeBlockArrowCommand, selectAllInsideCodeBlockCommand, splitAndLiftOutOfCodeBlockCommand } from './command';
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
      // Insert a new TextBlock
      'Enter': () => {
        // TODO: move into a wrapper function
        const ancestor = editor.view.state.selection.$from.node(AncestorDepth.GreatGrandParent);
        if(!ancestor || isCodeBlockNode(ancestor)) return false/*do not handle*/;
        return splitBlockKeepMarks(editor.view.state, editor.view.dispatch, editor.view);
      },

      // Toggle CodeBlock
      'Mod-Shift-c': () => shortcutCommandWrapper(editor, toggleWrapCommand(getCodeBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() })),
      'Mod-Shift-C': () => shortcutCommandWrapper(editor, toggleWrapCommand(getCodeBlockNodeType(editor.view.state.schema), { [AttributeType.Id]: generateNodeId() })),

      // split and lift out of CodeBlock
      'Shift-Enter': () => shortcutCommandWrapper(editor, splitAndLiftOutOfCodeBlockCommand),

      'Cmd-a': () => shortcutCommandWrapper(editor, selectAllInsideCodeBlockCommand),
      'Cmd-A': () => shortcutCommandWrapper(editor, selectAllInsideCodeBlockCommand),

      // set GapCursor if necessary
      'ArrowUp': () => shortcutCommandWrapper(editor, codeBlockArrowCommand('up')),
      'ArrowLeft': () => shortcutCommandWrapper(editor, codeBlockArrowCommand('left')),
      'ArrowDown': () => shortcutCommandWrapper(editor, codeBlockArrowCommand('down')),
      'ArrowRight': () => shortcutCommandWrapper(editor, codeBlockArrowCommand('right')),
    }),

    codeBlockPlugin(),
  ],
});

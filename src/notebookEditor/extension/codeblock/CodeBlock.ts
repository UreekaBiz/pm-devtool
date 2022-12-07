import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { getCodeBlockNodeType, generateNodeId, getNodeOutputSpec, isCodeBlockNode, insertNewlineCommand, selectTextBlockStartOrEndCommand, AttributeType, CodeBlockNodeSpec, LeaveBlockNodeDocumentUpdate, NodeName, DATA_NODE_TYPE } from 'common';

import { toggleBlock, blockBackspaceCommand, blockModBackspaceCommand, blockArrowUpCommand, blockArrowDownCommand } from 'notebookEditor/command/node';
import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model';

import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getCodeBlockAttrs } from './attribute';
import './codeBlock.css';
import { CodeBlockStorage, CodeBlockController } from './nodeView';
import { codeBlockOnTransaction } from './transaction';

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
      // toggle a CodeBlock
      'Shift-Mod-c': () => toggleBlock(editor, NodeName.CODEBLOCK, { [AttributeType.Id]: generateNodeId() }),
      'Shift-Mod-C': () => toggleBlock(editor, NodeName.CODEBLOCK, { [AttributeType.Id]: generateNodeId() }),

      // remove CodeBlock when Selection is at start of Document or CodeBlock is empty
      'Backspace': () => shortcutCommandWrapper(editor, blockBackspaceCommand(NodeName.CODEBLOCK)),

      // maintain expected Mod-Backspace behavior
      'Mod-Backspace': () => shortcutCommandWrapper(editor, blockModBackspaceCommand(NodeName.CODEBLOCK)),

      // set GapCursor or Selection at start or end of Block if necessary
      'ArrowUp': chainCommands(blockArrowUpCommand(NodeName.CODEBLOCK), selectTextBlockStartOrEndCommand('start', NodeName.CODEBLOCK)),
      'ArrowDown': chainCommands(blockArrowDownCommand(NodeName.CODEBLOCK), selectTextBlockStartOrEndCommand('end', NodeName.CODEBLOCK)),

      // insert a newline on Enter
      'Enter': () => shortcutCommandWrapper(editor, insertNewlineCommand(NodeName.CODEBLOCK)),

      // exit Node on Shift-Enter
      'Shift-Enter': () => applyDocumentUpdates(editor, [new LeaveBlockNodeDocumentUpdate(NodeName.CODEBLOCK)]),
    }),
  ],
});

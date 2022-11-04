import { generateNodeId, getNodeOutputSpec, isCodeBlockNode, insertNewlineCommand, selectBlockNodeContentCommand, AttributeType, CodeBlockNodeSpec, LeaveBlockNodeDocumentUpdate, NodeName, DATA_NODE_TYPE, getCodeBlockNodeType } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { createExtensionParseRules, defineNodeViewBehavior, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension';
import { toggleBlock, blockBackspaceCommand, blockModBackspaceCommand, blockArrowUpCommand, blockArrowDownCommand } from 'notebookEditor/extension/util';
import { createTextblockTypeInputRule } from 'notebookEditor/plugin/inputRule';
import { keymap } from 'prosemirror-keymap';

import { getCodeBlockAttrs } from './attribute';
import { CodeBlockController } from './nodeView/controller';
import { CodeBlockStorage } from './nodeView/storage';
import { codeBlockPlugin } from './plugin';

// ********************************************************************************
// == Constant ====================================================================
const codeBlockRegEx = /```([a-z]+)?[\s\n]$/;

// == Node ========================================================================
export const CodeBlock = new NodeExtension({
  name: NodeName.CODEBLOCK,
  priority: DEFAULT_EXTENSION_PRIORITY,

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

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<CodeBlockController>(editor, node, NodeName.CODEBLOCK, getPos, isCodeBlockNode, CodeBlockController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createTextblockTypeInputRule(codeBlockRegEx, getCodeBlockNodeType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    codeBlockPlugin(editor),
    keymap({
      // toggle a CodeBlock
      'Shift-Mod-c': () => toggleBlock(editor, NodeName.CODEBLOCK, { [AttributeType.Id]: generateNodeId() }),
      'Shift-Mod-C': () => toggleBlock(editor, NodeName.CODEBLOCK, { [AttributeType.Id]: generateNodeId() }),

      // remove CodeBlock when Selection is at start of Document or CodeBlock is empty
      'Backspace': () => shortcutCommandWrapper(editor, blockBackspaceCommand(NodeName.CODEBLOCK)),

      // maintain expected Mod-Backspace behavior
      'Mod-Backspace': () => shortcutCommandWrapper(editor, blockModBackspaceCommand(NodeName.CODEBLOCK)),

      // set GapCursor if necessary
      'ArrowUp': () => shortcutCommandWrapper(editor, blockArrowUpCommand(NodeName.CODEBLOCK)),
      'ArrowDown': () => shortcutCommandWrapper(editor, blockArrowDownCommand(NodeName.CODEBLOCK)),

      // insert a newline on Enter
      'Enter': () => shortcutCommandWrapper(editor, insertNewlineCommand(NodeName.CODEBLOCK)),

      // exit Node on Shift-Enter
      'Shift-Enter': () => applyDocumentUpdates(editor, [new LeaveBlockNodeDocumentUpdate(NodeName.CODEBLOCK)]),

      // select all the content of the CodeBlock
      'Cmd-a': () => shortcutCommandWrapper(editor, selectBlockNodeContentCommand(NodeName.CODEBLOCK)),
      'Cmd-A': () => shortcutCommandWrapper(editor, selectBlockNodeContentCommand(NodeName.CODEBLOCK)),
    }),
  ],
});

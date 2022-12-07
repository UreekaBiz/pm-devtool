import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { getCodeBlockNodeType, generateNodeId, getNodeOutputSpec, isCodeBlockNode, insertNewlineCommand, AttributeType, CodeBlockNodeSpec, LeaveBlockNodeDocumentUpdate, NodeName, DATA_NODE_TYPE } from 'common';

import { toggleBlock } from 'notebookEditor/command/node';
import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { Editor } from 'notebookEditor/editor/Editor';
import { ExtensionPriority } from 'notebookEditor/model';

import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { defineNodeViewBehavior } from '../type/NodeExtension/util';
import { getCodeBlockAttrs } from './attribute';
import './codeBlock.css';
import { goIntoCodeBlockArrowCommand } from './command';
import { getCodeBlockViewStorage, CodeBlockStorage, CodeBlockController } from './nodeView';
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
      'Shift-Mod-c': () => toggleCodeBlock(editor),
      'Shift-Mod-C': () => toggleCodeBlock(editor),

      // insert a newline on Enter
      'Enter': () => shortcutCommandWrapper(editor, insertNewlineCommand(NodeName.CODEBLOCK)),

      // exit Node on Shift-Enter
      'Shift-Enter': () => applyDocumentUpdates(editor, [new LeaveBlockNodeDocumentUpdate(NodeName.CODEBLOCK)]),

      // select a CodeBlock if arrow traversal would put the cursor inside it
      'ArrowLeft': goIntoCodeBlockArrowCommand('left'),
      'ArrowRight': goIntoCodeBlockArrowCommand('right'),
      'ArrowUp': goIntoCodeBlockArrowCommand('up'),
      'ArrowDown': goIntoCodeBlockArrowCommand('down'),
    }),
  ],
});

// NOTE: not a Command since storage must be accessed
const toggleCodeBlock = (editor: Editor) => {
  const id = generateNodeId(),
        commandResult = toggleBlock(editor, NodeName.CODEBLOCK, { [AttributeType.Id]: id });

  const { selection } = editor.view.state;
  if(!isCodeBlockNode(selection.$from.parent)) return commandResult/*no need to focus CodeBlock, it was toggled*/;

  const storage = getCodeBlockViewStorage(editor);
  const codeBlockView = storage.getNodeView(id);
  if(!codeBlockView) return false/*not setup yet*/;

  setTimeout(() => codeBlockView.nodeView.codeMirrorView?.focus(), 0/*after View has been created, T&E*/);
  return true/*handled*/;
};

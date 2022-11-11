import { keymap } from 'prosemirror-keymap';

import { chainCommands, generateNodeId, getNodeOutputSpec, isDemoAsyncNode2, insertNewlineCommand, selectBlockNodeContentCommand, selectTextBlockStartOrEndCommand, AttributeType, DemoAsyncNode2Spec, LeaveBlockNodeDocumentUpdate, NodeName, DATA_NODE_TYPE } from 'common';

import { applyDocumentUpdates, blockArrowUpCommand, blockBackspaceCommand, blockModBackspaceCommand, shortcutCommandWrapper, toggleBlock } from 'notebookEditor/command';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';
import { ExtensionPriority } from 'notebookEditor/model/type';

import { createExtensionParseRules, defineNodeViewBehavior, getExtensionAttributesObject, NodeExtension } from '../type';
import { getDemoAsyncNode2Attrs } from './attribute';
import './demoAsyncNode2.css';
import { DemoAsyncNode2Controller } from './nodeView/controller';

// ********************************************************************************
// == Node ========================================================================
export const DemoAsyncNode2 = new NodeExtension({
  name: NodeName.DEMO_ASYNC_NODE_2,
  priority: ExtensionPriority.DEMO_ASYNC_NODE_2,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getDemoAsyncNode2Attrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...DemoAsyncNode2Spec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.DEMO_ASYNC_NODE_2}"]`, preserveWhitespace: 'full'/*preserve new lines when parsing the content of the DemoAsyncNode2*/ }], getDemoAsyncNode2Attrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getDemoAsyncNode2Attrs(extensionStorage))),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage() { return new NodeViewStorage<DemoAsyncNode2Controller>(); },

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<DemoAsyncNode2Controller>(editor, node, NodeName.DEMO_ASYNC_NODE_2, getPos, isDemoAsyncNode2, DemoAsyncNode2Controller),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      // toggle a DemoAsyncNode2
      'Shift-Mod-Alt-d': () => toggleBlock(editor, NodeName.DEMO_ASYNC_NODE_2, { [AttributeType.Id]: generateNodeId() }),
      'Shift-Mod-Alt-D': () => toggleBlock(editor, NodeName.DEMO_ASYNC_NODE_2, { [AttributeType.Id]: generateNodeId() }),

      // remove DemoAsyncNode2 when at start of document or DemoAsyncNode2 is empty
      'Backspace': () => shortcutCommandWrapper(editor, blockBackspaceCommand(NodeName.DEMO_ASYNC_NODE_2)),

      // maintain expected Mod-Backspace behavior
      'Mod-Backspace': () => shortcutCommandWrapper(editor, blockModBackspaceCommand(NodeName.DEMO_ASYNC_NODE_2)),

      // set GapCursor or Selection at start or end of Block if necessary
      'ArrowUp': chainCommands(blockArrowUpCommand(NodeName.DEMO_ASYNC_NODE_2), selectTextBlockStartOrEndCommand('start', NodeName.DEMO_ASYNC_NODE_2)),
      'ArrowDown': chainCommands(blockArrowUpCommand(NodeName.DEMO_ASYNC_NODE_2), selectTextBlockStartOrEndCommand('end', NodeName.DEMO_ASYNC_NODE_2)),

      // insert a newline on Enter
      'Enter': () => shortcutCommandWrapper(editor, insertNewlineCommand(NodeName.DEMO_ASYNC_NODE_2)),

      // exit Node on Shift-Enter
      'Shift-Enter': () => applyDocumentUpdates(editor, [new LeaveBlockNodeDocumentUpdate(NodeName.DEMO_ASYNC_NODE_2)]),

      // select all the content of the DemoAsyncNode2
      'Cmd-a': () => shortcutCommandWrapper(editor, selectBlockNodeContentCommand(NodeName.DEMO_ASYNC_NODE_2)),
      'Cmd-A': () => shortcutCommandWrapper(editor, selectBlockNodeContentCommand(NodeName.DEMO_ASYNC_NODE_2)),
    }),
  ],
});

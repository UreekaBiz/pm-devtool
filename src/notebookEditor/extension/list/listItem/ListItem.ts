import { getNodeOutputSpec, ListItemNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';
import { keymap } from 'prosemirror-keymap';

import { ListItemAttrs } from './attribute';
import { liftListItemToDocumentCommand, liftListItemCommand, sinkListItemCommand, splitListItemKeepMarksCommand } from './command';
import { listItemPlugin } from './plugin';

// ********************************************************************************
// == Node ========================================================================
export const ListItem = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.ORDERED_LIST,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ListItemAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...ListItemNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // match ListItem tags and Block Nodes (which use the div tag)
    parseDOM: createExtensionParseRules([
      { tag: `li[${DATA_NODE_TYPE}="${NodeName.LIST_ITEM}"]` },
      { tag: 'li' },
      { tag: 'div' }], ListItemAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, ListItemAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    listItemPlugin(),
    keymap({
      'Enter': () => shortcutCommandWrapper(editor, splitListItemKeepMarksCommand),
      'Shift-Tab': () => shortcutCommandWrapper(editor, liftListItemCommand),
      'Tab': () => shortcutCommandWrapper(editor, sinkListItemCommand),
      'Backspace': () => shortcutCommandWrapper(editor, liftListItemToDocumentCommand),
    }),
  ],
});

import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, ListItemNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { ExtensionPriority } from 'notebookEditor/model';

import { ListItemAttrs } from './attribute';
import { liftListItemCommand, sinkListItemCommand, splitListItemKeepMarksCommand } from './command';
import { listItemPlugin } from './plugin';

// ********************************************************************************
// == Node ========================================================================
export const ListItem = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.LIST_ITEM,
  priority: ExtensionPriority.LIST_ITEM,

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
      'Enter':  splitListItemKeepMarksCommand,
      'Shift-Tab':  liftListItemCommand('Shift-Tab'),
      'Tab':  sinkListItemCommand,
      'Backspace':  liftListItemCommand('Backspace'),
    }),
  ],
});

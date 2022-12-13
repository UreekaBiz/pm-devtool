import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';

import { getNodeOutputSpec, ListItemNodeSpec, NodeName, DATA_NODE_TYPE, getListItemNodeType } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { ListItemAttrs } from './attribute';
import { changeListItemMarginCommand } from './command';

// ********************************************************************************
// == Node ========================================================================
export const ListItem = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.LIST_ITEM,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => (ListItemAttrs),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...ListItemNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `li[${DATA_NODE_TYPE}="${NodeName.LIST_ITEM}"]` }, { tag: 'li' }], ListItemAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, ListItemAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Enter': splitListItem(getListItemNodeType(editor.view.state.schema)),
      'Tab': chainCommands(changeListItemMarginCommand('increase'), sinkListItem(getListItemNodeType(editor.view.state.schema))),
      'Shift-Tab': chainCommands(changeListItemMarginCommand('decrease'), liftListItem(getListItemNodeType(editor.view.state.schema))),
    }),
  ],
});

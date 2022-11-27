import { keymap } from 'prosemirror-keymap';

import { chainCommands, getNodeOutputSpec, ListItemNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { ExtensionPriority } from 'notebookEditor/model';

import { ListItemAttrs } from './attribute';
import { joinBackwardToEndOfClosestListItemCommand, joinForwardToStartOfClosestListItemCommand, liftListItemCommand, sinkListItemCommand, splitListItemKeepMarksCommand } from './command';
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
    keymap({
      'Enter': chainCommands(liftListItemCommand('Enter'), splitListItemKeepMarksCommand),
      'Shift-Tab': liftListItemCommand('Shift-Tab'),
      'Tab': sinkListItemCommand,
      'Backspace': () => {
        const liftResult = liftListItemCommand('Backspace')(editor.view.state, editor.view.dispatch);
        if(liftResult) return liftResult/* else -- could not Lift */;

        return joinBackwardToEndOfClosestListItemCommand(editor.view.state, editor.view.dispatch);
      },
      'Delete': joinForwardToStartOfClosestListItemCommand,
    }),

    // NOTE: this plugin should be below the keymap from above, since its Commands
    //       may leave Lists in a state that allows them to be merged together
    //       immediately afterwards
    listItemPlugin(),
  ],
});

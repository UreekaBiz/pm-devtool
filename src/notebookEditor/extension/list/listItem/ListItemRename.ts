import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, ListItemNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { ExtensionPriority } from 'notebookEditor/model';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { liftListItemCommand, LiftListOperation } from './command/lift/liftListItem';
import { sinkListItemCommand } from './command/sink/sinkListItem';
import { splitListItemCommand } from './command/split/splitListItem';
import 'listItem.css'; 
import { listItemPlugin } from './plugin';

// ********************************************************************************
// == Node ========================================================================
export const ListItem = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.LIST_ITEM,
  priority: ExtensionPriority.LIST_ITEM,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...ListItemNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `li[${DATA_NODE_TYPE}="${NodeName.LIST_ITEM}"]` }, { tag: 'li' }], {/*no attrs*/}),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*no attrs*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Enter': liftOrSplit,
      'Shift-Tab': liftListItemCommand(LiftListOperation.Dedent),
      'Tab': sinkListItemCommand,
      'Backspace': liftListItemCommand(LiftListOperation.Remove),
      'Mod-Backspace': liftListItemCommand(LiftListOperation.Remove),
    }),
    listItemPlugin(),
  ],
});

// == Composed Command ============================================================
const liftOrSplit = chainCommands(liftListItemCommand(LiftListOperation.Untoggle), splitListItemCommand);

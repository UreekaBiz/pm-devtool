import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, ListItemNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { ExtensionPriority } from 'notebookEditor/model';

import { liftListItemCommand, LiftListOperation } from '../command/listItem/lift/liftListItem';
import { joinListItemBackwardCommand } from '../command/listItem/join/backward/joinListItemBackward';
import { joinListItemForwardCommand } from '../command/listItem/join/forward/joinListItemForward';
import { sinkListItemCommand } from '../command/listItem/sink/sinkListItem';
import { splitListItemKeepMarksCommand } from '../command/listItem/split/splitListItem';
import './listItem.css';
import { listItemPlugin } from './plugin';

// ********************************************************************************
// == Node ========================================================================
export const ListItem = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.LIST_ITEM,
  priority: ExtensionPriority.LIST_ITEM,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*currently nothing*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...ListItemNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.LIST_ITEM}"]` }, { tag: 'li' }], {/*currently nothing*/}),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*currently nothing*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Enter': splitOrLift,
      'Shift-Tab': liftListItemCommand(LiftListOperation.Dedent),
      'Tab': sinkListItemCommand,
      'Backspace': liftOrJoinBackward,
      'Mod-Backspace': liftOrJoinBackward,
      'Delete': joinListItemForwardCommand,
    }),

    // NOTE: this plugin should be below the keymap from above, since its Commands
    //       may leave Lists in a state that allows them to be merged together
    //       immediately afterwards
    listItemPlugin(),
  ],
});

// == Composed Command ============================================================
const splitOrLift = chainCommands(splitListItemKeepMarksCommand, liftListItemCommand(LiftListOperation.Untoggle));
const liftOrJoinBackward = chainCommands(liftListItemCommand(LiftListOperation.Remove), joinListItemBackwardCommand);

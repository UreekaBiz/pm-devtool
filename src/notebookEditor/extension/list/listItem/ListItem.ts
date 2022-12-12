import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, ListItemNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { ExtensionPriority } from 'notebookEditor/model';

import { joinBackwardToEndOfClosestListItemCommand, joinForwardToStartOfClosestListItemCommand, liftListItemCommand, sinkListItemCommand, splitListItemKeepMarksCommand, LiftListOperation } from './command';
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
    parseDOM: createExtensionParseRules([{ tag: `li[${DATA_NODE_TYPE}="${NodeName.LIST_ITEM}"]` }, { tag: 'li' }], {/*currently nothing*/}),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*currently nothing*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Enter': chainCommands(liftListItemCommand(LiftListOperation.Untoggle), splitListItemKeepMarksCommand),
      'Shift-Tab': liftListItemCommand(LiftListOperation.Dedent),
      'Tab': sinkListItemCommand,
      'Backspace': () => listItemBackSpaceBehavior(editor),
      'Mod-Backspace': () => listItemBackSpaceBehavior(editor),
      'Delete': joinForwardToStartOfClosestListItemCommand,
    }),

    // NOTE: this plugin should be below the keymap from above, since its Commands
    //       may leave Lists in a state that allows them to be merged together
    //       immediately afterwards
    listItemPlugin(),
  ],
});

// == Util ========================================================================
const listItemBackSpaceBehavior = (editor: Editor) => {
  const liftResult = liftListItemCommand(LiftListOperation.Remove)(editor.view.state, editor.view.dispatch);
  if(liftResult) return liftResult/* else -- could not Lift */;

  return joinBackwardToEndOfClosestListItemCommand(editor.view.state, editor.view.dispatch);
};

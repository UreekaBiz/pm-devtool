import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, NodeName, OrderedListNodeSpec, DATA_NODE_TYPE } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { toggleListCommand } from '../command/list/toggle/toggleListCommand';
import { createListWrapInputRule } from '../listInputRule';
import './orderedList.css';

// ********************************************************************************
// == Node ========================================================================
export const OrderedList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.ORDERED_LIST,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...OrderedListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.ORDERED_LIST}"]` }, { tag: 'ol' }], {/*no attrs*/}),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*no attrs*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createListWrapInputRule(NodeName.ORDERED_LIST)],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Shift-7': toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}) })],
});

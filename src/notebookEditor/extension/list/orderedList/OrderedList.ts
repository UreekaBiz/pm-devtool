import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, NodeName, OrderedListNodeSpec, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { ExtensionPriority, ParseRulePriority } from 'notebookEditor/model';

import { toggleListCommand } from '../command/toggleListCommand';
import { OrderedListAttrs } from './attribute';
import { createListWrapInputRule } from '../util';

// ********************************************************************************
// == Node ========================================================================
export const OrderedList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.ORDERED_LIST,
  priority: ExtensionPriority.ORDERED_LIST,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => OrderedListAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...OrderedListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([
      { tag: `ol[${DATA_NODE_TYPE}="${NodeName.ORDERED_LIST}"]`, priority: ParseRulePriority.ORDERED_LIST },
      { tag: 'ol', priority: ParseRulePriority.ORDERED_LIST }],
    OrderedListAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, OrderedListAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createListWrapInputRule(NodeName.ORDERED_LIST)],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Shift-7': toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}) })],
});

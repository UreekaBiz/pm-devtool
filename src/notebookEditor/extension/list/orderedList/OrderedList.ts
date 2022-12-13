import { keymap } from 'prosemirror-keymap';
import { wrappingInputRule } from 'prosemirror-inputrules';

import { getNodeOutputSpec, getOrderedListNodeType, NodeName, OrderedListNodeSpec, DATA_NODE_TYPE } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { OrderedListAttrs } from './attribute';

// ********************************************************************************
// == RegEx =======================================================================
const orderedListRegEx = /^(\d+)\.\s$/;

// == Node ========================================================================
export const OrderedList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.ORDERED_LIST,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => OrderedListAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...OrderedListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `ol[${DATA_NODE_TYPE}="${NodeName.ORDERED_LIST}"]` }, { tag: 'ol' }], OrderedListAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, OrderedListAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [wrappingInputRule(orderedListRegEx, getOrderedListNodeType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({})],
});

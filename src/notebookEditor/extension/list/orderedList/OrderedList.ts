import { getNodeOutputSpec, NodeName, OrderedListNodeSpec, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';

import { OrderedListAttrs } from './attribute';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-ordered-list/src/ordered-list.ts
// (SEE: addInputRules below)
// const orderedListRegex = /^(\d+)\.\s$/;

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
    parseDOM: createExtensionParseRules([ { tag: `ol[${DATA_NODE_TYPE}="${NodeName.ORDERED_LIST}"]` }, { tag: 'ol' }], OrderedListAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, OrderedListAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

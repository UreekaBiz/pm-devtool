import { getNodeOutputSpec, BulletListNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-bullet-list/src/bullet-list.ts
// (SEE: addInputRules below)
// const bulletListRegEx = /^\s*([-+*])\s$/;

// == Node ========================================================================
export const BulletList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.BULLET_LIST,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*currently no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...BulletListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([ { tag: `ul[${DATA_NODE_TYPE}="${NodeName.BULLET_LIST}"]` }, { tag: 'ul' }], {/*currently no attrs*/}),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*currently no attrs*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

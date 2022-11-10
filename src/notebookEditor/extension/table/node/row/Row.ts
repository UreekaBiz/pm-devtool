import { getNodeOutputSpec, NodeName, RowNodeSpec, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';

// ********************************************************************************
// == Node ========================================================================
export const Row = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.HEADER_CELL,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...RowNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `tr[${DATA_NODE_TYPE}="${NodeName.ROW}"]` }, { tag: 'tr' }], {/*no attrs*/}),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*no attrs*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

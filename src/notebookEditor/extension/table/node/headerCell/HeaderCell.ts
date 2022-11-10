import { getNodeOutputSpec, NodeName, CellNodeSpec, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';

import { HeaderCellAttrs } from './attribute';

// ********************************************************************************
// == Node ========================================================================
export const HeaderCell = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.HEADER_CELL,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => HeaderCellAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...CellNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `th[${DATA_NODE_TYPE}="${NodeName.CELL}"]` }, { tag: 'th' }], HeaderCellAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, HeaderCellAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

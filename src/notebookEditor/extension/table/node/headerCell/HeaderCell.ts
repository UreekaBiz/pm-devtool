import { getNodeOutputSpec, NodeName, HeaderCellNodeSpec, DATA_NODE_TYPE } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

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
  partialNodeSpec: { ...HeaderCellNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `th[${DATA_NODE_TYPE}="${NodeName.HEADER_CELL}"]` }, { tag: 'th' }], HeaderCellAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, HeaderCellAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

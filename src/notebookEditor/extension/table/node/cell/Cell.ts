import { getNodeOutputSpec, NodeName, CellNodeSpec, DATA_NODE_TYPE } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { CellAttrs } from './attribute';

// ********************************************************************************
// == Node ========================================================================
export const Cell = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.CELL,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => CellAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...CellNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `td[${DATA_NODE_TYPE}="${NodeName.CELL}"]` }, { tag: 'td' }], CellAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, CellAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [/*none*/],
});

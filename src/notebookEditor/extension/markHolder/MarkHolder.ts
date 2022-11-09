import { getNodeOutputSpec, MarkHolderNodeSpec, NodeName, DATA_NODE_TYPE, DEFAULT_EXTENSION_PRIORITY } from 'common';

import { createExtensionParseRules, NodeExtension } from '../type';
import { MarkHolderAttrs } from './attribute';
import { markHolderPlugin } from './plugin';

// ********************************************************************************
// == Node ========================================================================
export const MarkHolder = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.MARK_HOLDER,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => MarkHolderAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...MarkHolderNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.MARK_HOLDER}"]` }], MarkHolderAttrs),
    toDOM: (node) => getNodeOutputSpec(node, {/*no additional attrs*/ }),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [markHolderPlugin()],
});


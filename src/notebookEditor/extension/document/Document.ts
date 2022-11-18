import { DocumentNodeSpec, NodeName } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';

import { documentPlugin } from './plugin';

// ********************************************************************************
// == Node ========================================================================
export const Document = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.DOC,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*no attributes*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...DocumentNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({/*no DOM behavior*/}),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [documentPlugin()],
});

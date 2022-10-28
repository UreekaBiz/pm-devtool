import { DocumentNodeSpec, NodeName } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/Extension';

import { NodeExtension } from '../NodeExtension';

import { documentPlugin } from './plugin';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-document/src/document.ts

// == Node ========================================================================
export const Document = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.DOC,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  spec: { ...DocumentNodeSpec },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [documentPlugin()],
});

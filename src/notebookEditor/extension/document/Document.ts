import { DocumentNodeSpec, NodeName } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type';

import { NodeExtension } from '../type';

import { documentPlugin } from './plugin';

// ********************************************************************************
// == Node ========================================================================
export const Document = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.DOC,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  nodeSpec: {
    ...DocumentNodeSpec,
    attrs: {/*no attrs*/},
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [documentPlugin()],
});

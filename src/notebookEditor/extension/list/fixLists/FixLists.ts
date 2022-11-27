import { Extension } from 'notebookEditor/extension/type/Extension/Extension';
import { ExtensionName, ExtensionPriority } from 'notebookEditor/model';

import { fixListsPlugin } from './plugin';

// ********************************************************************************
// == Extension ===================================================================
export const FixLists = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.FIX_LISTS,
  priority: ExtensionPriority.FIX_LISTS,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [fixListsPlugin()],
});

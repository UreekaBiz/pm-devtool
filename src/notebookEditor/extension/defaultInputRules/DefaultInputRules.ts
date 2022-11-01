import { ExtensionName } from 'notebookEditor/model';
import { defaultInputRules } from 'notebookEditor/plugin/inputRule';

import { Extension, DEFAULT_EXTENSION_PRIORITY } from '../type';

// ********************************************************************************
// == Node ========================================================================
export const DefaultInputRules = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.HISTORY,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [...defaultInputRules],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [/*none*/],
});

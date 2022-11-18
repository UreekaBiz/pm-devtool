import { ExtensionName } from 'notebookEditor/model';
import { defaultInputRules } from 'notebookEditor/plugin/inputRule/defaultRules';

import { Extension } from '../type/Extension/Extension';
import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';

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

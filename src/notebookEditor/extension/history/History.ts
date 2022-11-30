import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import { ExtensionName } from 'notebookEditor/model';

import { Extension } from '../type/Extension/Extension';
import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';

// ********************************************************************************
// == Extension ===================================================================
export const History = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.HISTORY,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    history({ depth: 100/*PM's default*/, newGroupDelay: 500/*PM's default, ms*/ }),
    keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo }),
  ],
});

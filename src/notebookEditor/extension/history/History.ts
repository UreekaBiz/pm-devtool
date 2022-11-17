import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import { ExtensionName } from 'notebookEditor/model';

import { Extension, DEFAULT_EXTENSION_PRIORITY } from '../type';

// ********************************************************************************
// NOTE: default configuration inspired by https://github.com/ProseMirror/prosemirror-history/blob/master/src/history.ts

// == Node ========================================================================
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

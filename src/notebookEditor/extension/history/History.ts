import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';

import { ExtensionName } from 'notebookEditor/model';

import { Extension, DEFAULT_EXTENSION_PRIORITY } from '../type';

// ********************************************************************************
// == Node ========================================================================
export const History = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.HISTORY,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [
    history({ depth: 100/*PM's default*/, newGroupDelay: 500/*PM's default, in ms*/ }),
    keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo }),
  ],
});

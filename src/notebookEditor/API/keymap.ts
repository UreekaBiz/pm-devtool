import { undo, redo } from 'prosemirror-history';

import { splitBlockCommand } from 'common/notebookEditor/command';

// ********************************************************************************
// REF: https://raw.githubusercontent.com/ProseMirror/prosemirror-example-setup/master/src/keymap.ts

// == Keymap ======================================================================
export const getBasicKeymap = () => ({
  // -- Default -------------------------------------------------------------------
  'Mod-z': undo,
  'Shift-Mod-z': redo,
  'Enter': splitBlockCommand,

  // TODO: add
  // 'Backspace': undoInputRule,
  // 'Alt-ArrowUp': joinUp,
  // 'Alt-ArrowDown': joinDown,
  // 'Mod-BracketLeft': lift,
  // 'Escape': selectParentNode,
});

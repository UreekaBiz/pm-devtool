import { undo, redo } from 'prosemirror-history';

import { deleteSelectionCommand, splitBlockCommand } from 'common';

// ********************************************************************************
// REF: https://raw.githubusercontent.com/ProseMirror/prosemirror-example-setup/master/src/keymap.ts

// == Keymap ======================================================================
export const getBasicKeymap = () => ({
  // -- Default -------------------------------------------------------------------
  'Mod-z': undo,
  'Shift-Mod-z': redo,
  'Enter': splitBlockCommand,
  'Backspace': deleteSelectionCommand,
  'Mod-Backspace': deleteSelectionCommand,
});

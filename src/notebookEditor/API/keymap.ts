import { undo, redo } from 'prosemirror-history';

import { chainCommands, deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand, splitBlockCommand } from 'common';

// ********************************************************************************
// REF: https://raw.githubusercontent.com/ProseMirror/prosemirror-example-setup/master/src/keymap.ts

// == Keymap ======================================================================
export const getBasicKeymap = () => ({
  // -- Default -------------------------------------------------------------------
  'Mod-z': undo,
  'Shift-Mod-z': redo,
  'Enter': splitBlockCommand,
  'Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
  'Mod-Backspace': deleteSelectionCommand,
});

import { undo, redo } from 'prosemirror-history';

import { chainCommands, deleteSelectionCommand, joinBackwardCommand, liftEmptyBlockNodeCommand, selectNodeBackwardCommand, splitBlockCommand } from 'common';

// ********************************************************************************
// REF: https://prosemirror.net/docs/ref/#commands.baseKeymap

// == Keymap ======================================================================
export const getBasicKeymap = () => ({
  // -- Default -------------------------------------------------------------------
  'Enter': chainCommands(liftEmptyBlockNodeCommand, splitBlockCommand),

  'Mod-z': undo,
  'Shift-Mod-z': redo,
  'Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
  'Mod-Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
});

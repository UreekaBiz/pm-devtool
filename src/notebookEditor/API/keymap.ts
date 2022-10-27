import { undo, redo } from 'prosemirror-history';

import { chainCommands, deleteSelectionCommand, joinBackwardCommand, joinForwardCommand, liftEmptyBlockNodeCommand, selectNodeBackwardCommand, selectNodeForwardCommand, splitBlockCommand } from 'common';

// ********************************************************************************
// REF: https://prosemirror.net/docs/ref/#commands.baseKeymap

// == Keymap ======================================================================
/** returns the basic Keymap for a default Editor (SEE: REF above) */
export const getBasicKeymap = () => ({
  // -- Default -------------------------------------------------------------------
  'Enter': chainCommands(liftEmptyBlockNodeCommand, splitBlockCommand),
  'Mod-z': undo,
  'Shift-Mod-z': redo,
  'Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
  'Mod-Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
  'Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
  'Mod-Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
});

keymap({
  'Enter': chainCommands(liftEmptyBlockNodeCommand, splitBlockCommand),
  'Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
  'Mod-Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
  'Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
  'Mod-Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
}),

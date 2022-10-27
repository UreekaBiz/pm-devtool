import { keymap } from 'prosemirror-keymap';

import { chainCommands, deleteSelectionCommand, joinBackwardCommand, joinForwardCommand, liftEmptyBlockNodeCommand, selectNodeBackwardCommand, selectNodeForwardCommand, splitBlockCommand } from 'common';

import { ExtensionName } from 'notebookEditor/model/type';

import { Extension } from '../type';

// ********************************************************************************
// REF: https://prosemirror.net/docs/ref/#commands.baseKeymap

// == Extension ===================================================================
export const BasicKeymap: Extension = {
  name: ExtensionName.BASIC_KEYMAP,

  // -- Plugin --------------------------------------------------------------------
  proseMirrorPlugins: [
    keymap({
      'Enter': chainCommands(liftEmptyBlockNodeCommand, splitBlockCommand),
      'Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
      'Mod-Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
      'Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
      'Mod-Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
    }),
  ],
};


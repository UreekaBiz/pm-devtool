import { keymap } from 'prosemirror-keymap';

import { chainCommands, deleteSelectionCommand, joinBackwardCommand, joinForwardCommand, liftEmptyBlockNodeCommand, selectNodeBackwardCommand, selectNodeForwardCommand, splitBlockCommand } from 'common';

import { ExtensionName } from 'notebookEditor/model';
import { undoInputRuleCommand } from 'notebookEditor/plugin/inputRule/command';

import { Extension } from '../type/Extension/Extension';
import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';

// ********************************************************************************
// REF: https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/keymap.ts

// == Node ========================================================================
export const BasicKeymap = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.BASIC_KEYMAP,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [
    keymap({
      'Enter': chainCommands(liftEmptyBlockNodeCommand, splitBlockCommand),
      'Backspace': chainCommands(undoInputRuleCommand, deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
      'Mod-Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
      'Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
      'Mod-Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
    }),
  ],
});

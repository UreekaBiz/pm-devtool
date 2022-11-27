import { keymap } from 'prosemirror-keymap';
import { chainCommands, deleteSelection, joinBackward, joinForward, liftEmptyBlock, selectNodeBackward, selectNodeForward } from 'prosemirror-commands';

import { splitBlockKeepMarksCommand } from 'common';

import { ExtensionName, ExtensionPriority } from 'notebookEditor/model';
import { undoInputRuleCommand } from 'notebookEditor/plugin/inputRule/command';

import { Extension } from '../type/Extension/Extension';
import { basicKeymapPlugin } from './plugin';

// ********************************************************************************
// REF: https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/keymap.ts

// == Node ========================================================================
export const BasicKeymap = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.BASIC_KEYMAP,
  priority: ExtensionPriority.BASIC_KEYMAP,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [
    basicKeymapPlugin(),
    keymap({
      'Enter': chainCommands(liftEmptyBlock, splitBlockKeepMarksCommand),
      'Backspace': chainCommands(undoInputRuleCommand, deleteSelection, joinBackward, selectNodeBackward),
      'Mod-Backspace': chainCommands(deleteSelection, joinBackward, selectNodeBackward),
      'Delete': chainCommands(deleteSelection, joinForward, selectNodeForward),
      'Mod-Delete': chainCommands(deleteSelection, joinForward, selectNodeForward),
    }),
  ],
});

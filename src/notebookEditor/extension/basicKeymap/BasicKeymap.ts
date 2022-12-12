import { chainCommands, deleteSelection, joinBackward, joinForward, liftEmptyBlock, selectNodeBackward, selectNodeForward, splitBlockKeepMarks } from 'prosemirror-commands';
import { undoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { Command } from 'prosemirror-state';

import { Editor } from 'notebookEditor/editor/Editor';
import { ExtensionName, ExtensionPriority } from 'notebookEditor/model';

import { Extension } from '../type/Extension/Extension';
import { basicKeymapPlugin } from './plugin';

// ********************************************************************************
// == Extension ===================================================================
export const BasicKeymap = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.BASIC_KEYMAP,
  priority: ExtensionPriority.BASIC_KEYMAP,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    basicKeymapPlugin(),
    keymap({
      'Enter': () => wrapBasicKeymapCommand(editor, chainCommands(liftEmptyBlock, splitBlockKeepMarks)),
      'Backspace': () => wrapBasicKeymapCommand(editor, chainCommands(undoInputRule, deleteSelection, joinBackward, selectNodeBackward)),
      'Mod-Backspace': () => wrapBasicKeymapCommand(editor, chainCommands(deleteSelection, joinBackward, selectNodeBackward)),
      'Delete': () => wrapBasicKeymapCommand(editor, chainCommands(deleteSelection, joinForward, selectNodeForward)),
      'Mod-Delete': () => wrapBasicKeymapCommand(editor, chainCommands(deleteSelection, joinForward, selectNodeForward)),
    }),
  ],
});

// == Util ========================================================================
/** notify about errors resulting from Commands and prevent their effects */
const wrapBasicKeymapCommand = (editor: Editor, command: Command) => {
  try {
    return command(editor.view.state, editor.view.dispatch, editor.view);
  } catch(error) {
    console.warn(`error executing a Command`, error);
    return false/*do not execute*/;
  }
};

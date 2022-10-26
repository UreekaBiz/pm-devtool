import { undo, redo } from 'prosemirror-history';

// ********************************************************************************
// REF: https://raw.githubusercontent.com/ProseMirror/prosemirror-example-setup/master/src/keymap.ts

// == Keymap ======================================================================
export const getBasicKeymap = () => ({
  'Mod-z': undo,
  'Shift-Mod-z': redo,

  // TODO: add
  // 'Backspace': undoInputRule,
  // 'Alt-ArrowUp': joinUp,
  // 'Alt-ArrowDown': joinDown,
  // 'Mod-BracketLeft': lift,
  // 'Escape': selectParentNode,
});

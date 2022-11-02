import { keymap } from 'prosemirror-keymap';

import { NodeName, TextNodeSpec } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model';

import { NodeExtension } from '../type/NodeExtension';
import { insertTabCommand } from './command';

// ********************************************************************************
// == Node ========================================================================
export const Text = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.TEXT,
  priority: ExtensionPriority.TEXT,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...TextNodeSpec },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Tab': () => shortcutCommandWrapper(editor, insertTabCommand) })],
});

import { keymap } from 'prosemirror-keymap';

import { NodeName, TextNodeSpec } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model/type';

import { NodeExtension } from '../NodeExtension';
import { insertTabCommand } from './command';

// ********************************************************************************
// == Node ========================================================================
export const Text = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.TEXT,
  priority: ExtensionPriority.TEXT,

  // -- Spec ----------------------------------------------------------------------
  spec: { ...TextNodeSpec },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Tab': () => shortcutCommandWrapper(editor, insertTabCommand) })],
});

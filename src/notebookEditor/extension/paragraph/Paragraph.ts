import { keymap } from 'prosemirror-keymap';

import { NodeName, ParagraphNodeSpec } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model/type';

import { NodeExtension } from '../NodeExtension';
import { setParagraphCommand } from './command';

// ********************************************************************************
// == Node ========================================================================
export const Paragraph = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.PARAGRAPH,
  priority: ExtensionPriority.PARAGRAPH,

  // -- Spec ----------------------------------------------------------------------
  spec: {
    ...ParagraphNodeSpec,
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Alt-0': () => shortcutCommandWrapper(editor, setParagraphCommand) })],
});

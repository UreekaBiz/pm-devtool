import { gapCursor } from 'prosemirror-gapcursor';

import { ExtensionName, DEFAULT_EXTENSION_PRIORITY } from 'common';

import { Extension } from '../type';
import './gapcursor.css';

// ********************************************************************************
// == Node ========================================================================
export const GapCursor = new Extension({
  // -- Definition ----------------------------------------------------------------
  name: ExtensionName.GAP_CURSOR,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [gapCursor()],
});

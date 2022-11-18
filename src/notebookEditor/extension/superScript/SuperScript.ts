import { keymap } from 'prosemirror-keymap';

import { getMarkOutputSpec, MarkName, SuperScriptMarkSpec } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { MarkExtension } from '../type/MarkExtension/MarkExtension';
import { safeParseTag } from '../util/parse';
import { toggleSuperScriptCommand } from './command';

// ********************************************************************************
// == Mark ========================================================================
export const SuperScript = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.SUPER_SCRIPT,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...SuperScriptMarkSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Bold does not have any attributes
    parseDOM: [safeParseTag('sup')],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  }),


  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-.': () => shortcutCommandWrapper(editor, toggleSuperScriptCommand) })],
});

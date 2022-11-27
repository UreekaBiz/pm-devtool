import { keymap } from 'prosemirror-keymap';

import { getMarkOutputSpec, UnderlineMarkSpec, MarkName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { MarkExtension } from '../type/MarkExtension/MarkExtension';
import { safeParseTag, wrapGetStyleAttrs } from '../util/parse';
import { toggleUnderlineCommand } from './command';

// ********************************************************************************
// == Mark ========================================================================
export const Underline = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.UNDERLINE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...UnderlineMarkSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Bold does not have any attributes
    parseDOM: [
      safeParseTag('u'),
      {
        style: 'text-decoration',
        consuming: false/*keep matching rules after this one*/,
        getAttrs: wrapGetStyleAttrs(style => style.includes('underline') ? {/*match, with no attributes*/} : false/*do not match*/),
      },
    ],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-u': () => shortcutCommandWrapper(editor, toggleUnderlineCommand),
      'Mod-U': () => shortcutCommandWrapper(editor, toggleUnderlineCommand),
    }),
  ],
});

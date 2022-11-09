import { keymap } from 'prosemirror-keymap';

import { getMarkOutputSpec, getStrikethroughMarkType, StrikethroughMarkSpec, MarkName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { createMarkInputRule } from 'notebookEditor/plugin/inputRule';
import { createMarkPasteRule } from 'notebookEditor/plugin/pasteRule';

import { MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { safeParseTag } from '../util/parse';
import { toggleStrikethroughCommand } from './command';

// ********************************************************************************
// == RegEx =======================================================================
const strikethroughInputRegEx = /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))$/;
const strikethroughPasteRegEx = /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))/g;

// == Mark ========================================================================
export const Strikethrough = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.STRIKETHROUGH,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...StrikethroughMarkSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules
    parseDOM: [
      safeParseTag('s'),
      safeParseTag('del'),
      safeParseTag('strike'),
      {
        style: 'text-decoration',
        consuming: false/*allow other rules to keep matching after this one matches*/,
        getAttrs: (style) => (typeof style === 'string' && style.includes('line-through') ? {/*match, with no attributes*/} : false/*don't match rule*/),
      },
    ],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createMarkInputRule(strikethroughInputRegEx, getStrikethroughMarkType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [createMarkPasteRule(strikethroughPasteRegEx, getStrikethroughMarkType(editor.view.state.schema))],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-x': () => shortcutCommandWrapper(editor, toggleStrikethroughCommand),
      'Mod-X': () => shortcutCommandWrapper(editor, toggleStrikethroughCommand),
    }),
  ],
});

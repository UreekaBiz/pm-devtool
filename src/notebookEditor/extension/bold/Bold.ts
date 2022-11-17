import { keymap } from 'prosemirror-keymap';

import { getBoldMarkType, getMarkOutputSpec, BoldMarkSpec, MarkName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { createMarkInputRule } from 'notebookEditor/plugin/inputRule';
import { createMarkPasteRule } from 'notebookEditor/plugin/pasteRule';

import { MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { safeParseTag, wrapGetStyleAttrs, wrapGetTagAttrs } from '../util/parse';
import { toggleBoldCommand } from './command';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: these are inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-bold/src/bold.ts
const cssFontWeightRegex = /^(bold(er)?|[5-9]\d{2}|1000)$/;

// --------------------------------------------------------------------------------
// FIXME: incorrect / inconsistent RegEx (negated '__')

// NOTE: these are Markdown equivalents
export const starInputRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/;
export const underscoreInputRegex = /(?:^|\s)((?:__)((?:[^(__)]+))(?:__))$/;

export const starPasteRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g;
export const underscorePasteRegex = /(?:^|\s)((?:__)((?:[^(__)]+))(?:__))/g;

// == Mark ========================================================================
export const Bold = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.BOLD,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute ----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...BoldMarkSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Bold does not have any attributes
    parseDOM: [
      safeParseTag('strong'),
      { ...safeParseTag('b'), getAttrs: wrapGetTagAttrs((node) => node.style.fontWeight !== 'normal') },
      { style: 'font-weight', getAttrs: wrapGetStyleAttrs((value) => cssFontWeightRegex.test(value)) },
    ],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [
    createMarkInputRule(starInputRegex, getBoldMarkType(editor.view.state.schema)),
    createMarkInputRule(underscoreInputRegex, getBoldMarkType(editor.view.state.schema)),
  ],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [
    createMarkPasteRule(starPasteRegex, getBoldMarkType(editor.view.state.schema)),
    createMarkPasteRule(underscorePasteRegex, getBoldMarkType(editor.view.state.schema)),
  ],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-b': () => shortcutCommandWrapper(editor, toggleBoldCommand),
      'Mod-B': () => shortcutCommandWrapper(editor, toggleBoldCommand),
    }),
  ],
});

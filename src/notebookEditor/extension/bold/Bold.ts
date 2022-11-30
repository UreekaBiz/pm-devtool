import { keymap } from 'prosemirror-keymap';

import { getBoldMarkType, getMarkOutputSpec, BoldMarkSpec, MarkName, DATA_MARK_TYPE } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { createMarkInputRule } from 'notebookEditor/plugin/inputRule/inputRuleBuilders';
import { createMarkPasteRule } from 'notebookEditor/plugin/pasteRule/pasteRuleBuilders';

import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { MarkExtension } from '../type/MarkExtension/MarkExtension';
import { safeParseTag, wrapGetStyleAttrs, wrapGetTagAttrs } from '../util/parse';
import { toggleBoldCommand } from './command';
import './bold.css';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-bold/src/bold.ts
const cssFontWeightRegex = /^(bold(er)?|[5-9]\d{2}|1000)$/;

// --------------------------------------------------------------------------------
// NOTE: these are Markdown equivalents
export const starInputRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/;
export const underscoreInputRegex = /(?:^|\s)((?:__)((?:[^_]+))(?:__))$/;

export const starPasteRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g;
export const underscorePasteRegex = /(?:^|\s)((?:__)((?:[^_]+))(?:__))/g;

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
      { tag: `span[${DATA_MARK_TYPE}="${MarkName.BOLD}"]` },
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

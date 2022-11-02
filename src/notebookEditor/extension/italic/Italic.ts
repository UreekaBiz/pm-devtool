import { keymap } from 'prosemirror-keymap';

import { getItalicMarkType, getMarkOutputSpec, MarkName, ItalicMarkSpec } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { createMarkInputRule } from 'notebookEditor/plugin/inputRule';
import { createMarkPasteRule } from 'notebookEditor/plugin/pasteRule';

import { MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { safeParseTag, wrapGetTagAttrs } from '../util/parse';
import { toggleItalicCommand } from './command';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: these are Markdown equivalents
const starInputRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))$/;
const underscoreInputRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))$/;

const starPasteRegex = /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))/g;
const underscorePasteRegex = /(?:^|\s)((?:_)((?:[^_]+))(?:_))/g;

// == Mark ========================================================================
export const Italic = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.ITALIC,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...ItalicMarkSpec },

  // -- DOM ----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Italic does not have any attributes
    parseDOM: [
      safeParseTag('em'),
      {
        tag: 'i',
        getAttrs: wrapGetTagAttrs((node) => {
          const style = node.getAttribute('style');
          if(!style) return false/*don't match rule*/;

          if(style.includes('italic')) {
            return {/*match, with no attributes*/};
          } else {
            return false/*don't match rule*/;
          }
        }),
      },
      { style: 'font-style=italic' },
    ],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [
    createMarkInputRule(starInputRegex, getItalicMarkType(editor.view.state.schema)),
    createMarkInputRule(underscoreInputRegex, getItalicMarkType(editor.view.state.schema)),
  ],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [
    createMarkPasteRule(starPasteRegex, getItalicMarkType(editor.view.state.schema)),
    createMarkPasteRule(underscorePasteRegex, getItalicMarkType(editor.view.state.schema)),
  ],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-i': () => shortcutCommandWrapper(editor, toggleItalicCommand),
      'Mod-I': () => shortcutCommandWrapper(editor, toggleItalicCommand),
    }),
  ],
});

import { keymap } from 'prosemirror-keymap';

import { getMarkOutputSpec, CodeMarkSpec, MarkName, getCodeMarkType } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { createMarkInputRule } from 'notebookEditor/plugin/inputRule';
import { createMarkPasteRule } from 'notebookEditor/plugin/pasteRule';

import { MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { safeParseTag } from '../util/parse';
import './code.css';
import { toggleCodeCommand } from './command';

// ********************************************************************************
// == RegEx =======================================================================
export const backtickInputRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))$/;
export const backtickPasteRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))/g;

// == Mark ========================================================================
export const Code = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.CODE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  markSpec: {
    ...CodeMarkSpec,

    attrs: {/*no attributes*/},

    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Bold does not have any attributes
    parseDOM: [safeParseTag('code')],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createMarkInputRule(backtickInputRegex, getCodeMarkType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [createMarkPasteRule(backtickPasteRegex, getCodeMarkType(editor.view.state.schema))],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-e': () => shortcutCommandWrapper(editor, toggleCodeCommand),
      'Mod-E': () => shortcutCommandWrapper(editor, toggleCodeCommand),
    }),
  ],
});

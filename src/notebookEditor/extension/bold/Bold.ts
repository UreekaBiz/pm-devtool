import { keymap } from 'prosemirror-keymap';

import { getMarkOutputSpec, BoldMarkSpec, MarkName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { safeParseTag, wrapGetStyleAttrs, wrapGetTagAttrs } from '../util/parse';
import { toggleBoldCommand } from './command';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-bold/src/bold.ts

// == RegEx =======================================================================
const cssFontWeightRegex = /^(bold(er)?|[5-9]\d{2}|1000)$/;

// --------------------------------------------------------------------------------
// NOTE: these are Markdown equivalents
const starRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/;
const underscoreRegex = /(?:^|\s)((?:__)((?:[^_]+))(?:__))/ /*FIXME: incorrect / inconsistent RegEx (negated '__')*/;

// == Mark ========================================================================
export const Bold = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.BOLD,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  markSpec: {
    ...BoldMarkSpec,

    attrs: {/*no attributes*/},

    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Bold does not have any attributes
    parseDOM: [
      safeParseTag('strong'),
      { ...safeParseTag('b'), getAttrs: wrapGetTagAttrs((node) => node.style.fontWeight !== 'normal') },
      { style: 'font-weight', getAttrs: wrapGetStyleAttrs((value) => cssFontWeightRegex.test(value)) },
    ],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-b': () => shortcutCommandWrapper(editor, toggleBoldCommand),
      'Mod-B': () => shortcutCommandWrapper(editor, toggleBoldCommand),
    }),
  ],
});

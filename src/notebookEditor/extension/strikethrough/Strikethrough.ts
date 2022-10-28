import { keymap } from 'prosemirror-keymap';

import { getMarkOutputSpec, StrikethroughMarkSpec, MarkName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

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

  // -- Spec ----------------------------------------------------------------------
  markSpec: {
    ...StrikethroughMarkSpec,

    attrs: {/*no attributes*/},

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
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      'Mod-x': () => shortcutCommandWrapper(editor, toggleStrikethroughCommand),
      'Mod-X': () => shortcutCommandWrapper(editor, toggleStrikethroughCommand),
    }),
  ],
});

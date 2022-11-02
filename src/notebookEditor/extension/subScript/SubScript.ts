import { keymap } from 'prosemirror-keymap';

import { getMarkOutputSpec, MarkName, SubScriptMarkSpec } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { safeParseTag, wrapGetStyleAttrs } from '../util/parse';
import { toggleSubScriptCommand } from './command';

// ********************************************************************************
// == Mark ========================================================================
export const SubScript = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.SUB_SCRIPT,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  markSpec: {
    ...SubScriptMarkSpec,

    attrs: {/*no attributes*/},

    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Bold does not have any attributes
    parseDOM: [
      safeParseTag('sub'),
      {
        style: 'vertical-align',
        getAttrs: wrapGetStyleAttrs(value => {
          // check for vertical alignment
          if(value !== 'sub') {
            return false;
          } /* else -- match */

          return null/*match and add empty/default set of attrs */;
        }),
      },
    ],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-,': () => shortcutCommandWrapper(editor, toggleSubScriptCommand) })],
});

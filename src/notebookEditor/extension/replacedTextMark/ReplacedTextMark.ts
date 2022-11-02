import { getMarkOutputSpec, MarkName, ReplacedTextMarkMarkSpec, DATA_MARK_TYPE } from 'common';

import { MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { replacedTextMarkPlugin } from './plugin';

// ********************************************************************************
// == Mark ========================================================================
export const ReplacedTextMark = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.REPLACED_TEXT_MARK,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => ({/*no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...ReplacedTextMarkMarkSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified in the ParseRules, but Bold does not have any attributes
    parseDOM: [{ tag: `span[${DATA_MARK_TYPE}="${MarkName.REPLACED_TEXT_MARK}"]` }],
    toDOM: (mark) => getMarkOutputSpec(mark, {/*no attrs*/}),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [replacedTextMarkPlugin()],
});

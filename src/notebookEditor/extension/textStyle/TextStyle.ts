import { getMarkOutputSpec, TextStyleMarkSpec, MarkName, DEFAULT_EXTENSION_PRIORITY } from 'common';

import { getExtensionAttributesObject, MarkExtension } from '../type';
import { isValidHTMLElement, safeParseTag } from '../util/parse';
import { TextStyleAttrs } from './attribute';

// ********************************************************************************
// == Mark ========================================================================
export const TextStyle = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.TEXT_STYLE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => TextStyleAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...TextStyleMarkSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    // NOTE: createExtensionParseRules not being used since specific getAttrs must
    //       be specified
    parseDOM: [
      {
        ...safeParseTag('span'),
        getAttrs: (element) => {
          if(!isValidHTMLElement(element)) return false/*nothing to do*/;

          return element.hasAttribute('style') ? {} : false/*no styles*/;
        },
      }],
    toDOM: (mark) => getMarkOutputSpec(mark, getExtensionAttributesObject(mark, TextStyleAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [/*none*/],
});

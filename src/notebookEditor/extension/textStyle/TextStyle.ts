import { getMarkOutputSpec, TextStyleMarkSpec, MarkName } from 'common';

import { getExtensionAttributesObject, MarkExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { isValidHTMLElement, safeParseTag } from '../util/parse';
import { TextStyleAttrs } from './attribute';

// ********************************************************************************
// == Mark ========================================================================
export const TextStyle = new MarkExtension({
  // -- Definition ----------------------------------------------------------------
  name: MarkName.TEXT_STYLE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  markSpec: {
    ...TextStyleMarkSpec,

    attrs: TextStyleAttrs,

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
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: () => [/*none*/],
});

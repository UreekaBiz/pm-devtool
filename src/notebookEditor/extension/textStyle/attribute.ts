import { TextStyleAttributes, AttributeType } from 'common';

import { NodeExtensionAttributes } from '../type/NodeExtension/type';

// ********************************************************************************
// == Constant ====================================================================
const replaceQuotesRegEx = /['"]+/g;

// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const TextStyleAttrs: NodeExtensionAttributes<TextStyleAttributes> = {
  [AttributeType.FontSize]: { default: undefined/*none*/, parseHTML: (element) => element.style.fontSize.replace(replaceQuotesRegEx, '') },
  [AttributeType.Color]: { default: undefined/*none*/, parseHTML: (element) => element.style.color.replace(replaceQuotesRegEx, '') },
  [AttributeType.BackgroundColor]: { default: undefined/*none*/, parseHTML: (element) => element.style.backgroundColor.replace(replaceQuotesRegEx, '') },
};

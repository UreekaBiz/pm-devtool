import { BlockquoteAttributes, AttributeType, SetAttributeType } from 'common';

import { NodeExtensionAttributes } from '../type';
import { setAttributeParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const BlockquoteAttrs: NodeExtensionAttributes<BlockquoteAttributes> = {
  [AttributeType.BackgroundColor]: setAttributeParsingBehavior(AttributeType.BackgroundColor, SetAttributeType.STYLE),
  [AttributeType.BorderLeft]: setAttributeParsingBehavior(AttributeType.BorderLeft, SetAttributeType.STYLE),
  [AttributeType.BorderColor]: setAttributeParsingBehavior(AttributeType.BorderColor, SetAttributeType.STYLE),
  [AttributeType.Color]: setAttributeParsingBehavior(AttributeType.Color, SetAttributeType.STYLE),
  [AttributeType.FontSize]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STYLE),
  [AttributeType.MarginLeft]: setAttributeParsingBehavior(AttributeType.MarginLeft, SetAttributeType.STYLE),
};

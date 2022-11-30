import { ParagraphAttributes, AttributeType, SetAttributeType } from 'common';

import { NodeExtensionAttributes } from '../type/NodeExtension/type';
import { setAttributeParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const ParagraphAttrs: NodeExtensionAttributes<ParagraphAttributes> = {
  [AttributeType.BackgroundColor]: setAttributeParsingBehavior(AttributeType.BackgroundColor, SetAttributeType.STYLE),
  [AttributeType.Color]: setAttributeParsingBehavior(AttributeType.Color, SetAttributeType.STYLE),
  [AttributeType.FontSize]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STYLE),
};

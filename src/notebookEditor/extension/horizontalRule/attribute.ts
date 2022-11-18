import { HorizontalRuleAttributes, AttributeType, SetAttributeType, DEFAULT_HORIZONTAL_RULE_BACKGROUND_COLOR, DEFAULT_HORIZONTAL_RULE_HEIGHT } from 'common';

import { NodeExtensionAttributes } from '../type/NodeExtension/type';
import { setAttributeParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const HorizontalRuleAttrs: NodeExtensionAttributes<HorizontalRuleAttributes> = {
  [AttributeType.BackgroundColor]: setAttributeParsingBehavior(AttributeType.BackgroundColor, SetAttributeType.STYLE, DEFAULT_HORIZONTAL_RULE_BACKGROUND_COLOR),
  [AttributeType.Height]: setAttributeParsingBehavior(AttributeType.Height, SetAttributeType.STYLE, DEFAULT_HORIZONTAL_RULE_HEIGHT),
};

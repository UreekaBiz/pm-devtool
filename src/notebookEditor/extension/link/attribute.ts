import { AttributeType, SetAttributeType, LinkAttributes, DEFAULT_LINK_HREF, DEFAULT_LINK_TARGET } from 'common';

import { MarkExtensionAttributes } from '../type/MarkExtension/type';
import { setAttributeParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const LinkAttrs: MarkExtensionAttributes<LinkAttributes> = {
  [AttributeType.Href]: setAttributeParsingBehavior(AttributeType.Href, SetAttributeType.STRING, DEFAULT_LINK_HREF),
  [AttributeType.Target]: setAttributeParsingBehavior(AttributeType.Target, SetAttributeType.STRING, DEFAULT_LINK_TARGET),

  [AttributeType.Color]: setAttributeParsingBehavior(AttributeType.Color, SetAttributeType.STRING),
};

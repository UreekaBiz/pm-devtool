import { generateNodeId, getHeadingLevelFromTag, HeadingAttributes, AttributeType, SetAttributeType, HeadingLevel } from 'common';

import { NodeExtensionAttributes } from '../type/NodeExtension/type';
import { setAttributeParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const HeadingAttrs: NodeExtensionAttributes<HeadingAttributes> = {
  // Creates a new id for the node when it is created
  // NOTE: not using uniqueIdParsingBehavior since Headings have no storage
  [AttributeType.Id]: { default: generateNodeId(), parseHTML: () => generateNodeId() },

  [AttributeType.Level]: { default: HeadingLevel.One, parseHTML: (element) => getHeadingLevelFromTag(element.tagName) ?? HeadingLevel.One/*default*/ },

  [AttributeType.BackgroundColor]: setAttributeParsingBehavior(AttributeType.BackgroundColor, SetAttributeType.STYLE),
  [AttributeType.Color]: setAttributeParsingBehavior(AttributeType.Color, SetAttributeType.STYLE),
  [AttributeType.FontSize]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STYLE),

  [AttributeType.PaddingTop]: setAttributeParsingBehavior(AttributeType.PaddingTop, SetAttributeType.STYLE),
  [AttributeType.PaddingBottom]: setAttributeParsingBehavior(AttributeType.PaddingBottom, SetAttributeType.STYLE),
  [AttributeType.PaddingLeft]: setAttributeParsingBehavior(AttributeType.PaddingLeft, SetAttributeType.STYLE),
  [AttributeType.PaddingRight]: setAttributeParsingBehavior(AttributeType.PaddingRight, SetAttributeType.STYLE),

  [AttributeType.MarginTop]: setAttributeParsingBehavior(AttributeType.MarginTop, SetAttributeType.STYLE),
  [AttributeType.MarginLeft]: setAttributeParsingBehavior(AttributeType.MarginLeft, SetAttributeType.STYLE),
  [AttributeType.MarginBottom]: setAttributeParsingBehavior(AttributeType.MarginBottom, SetAttributeType.STYLE),
  [AttributeType.MarginRight]: setAttributeParsingBehavior(AttributeType.MarginRight, SetAttributeType.STYLE),
};

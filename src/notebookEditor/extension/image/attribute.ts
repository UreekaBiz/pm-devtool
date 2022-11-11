import { AttributeType, SetAttributeType, ImageAttributes, DEFAULT_IMAGE_BORDER_COLOR, DEFAULT_IMAGE_BORDER_STYLE, DEFAULT_IMAGE_BORDER_WIDTH, DEFAULT_IMAGE_WIDTH, DEFAULT_IMAGE_HEIGHT } from 'common';

import { ExtensionStorageType, NodeExtensionAttributes } from '../type';
import { setAttributeParsingBehavior, uniqueIdParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getImageAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<ImageAttributes> =>  ({
  // creates a new Id for the Node when it is created
  [AttributeType.Id]:  uniqueIdParsingBehavior(storage),

  // whether or not this Image has been uploaded to Storage
  [AttributeType.Uploaded]: setAttributeParsingBehavior(AttributeType.Uploaded, SetAttributeType.BOOLEAN, false/*default not uploaded*/),

  [AttributeType.Src]: setAttributeParsingBehavior(AttributeType.Src, SetAttributeType.STRING),
  [AttributeType.Alt]: setAttributeParsingBehavior(AttributeType.Alt, SetAttributeType.STRING),
  [AttributeType.Title]: setAttributeParsingBehavior(AttributeType.Title, SetAttributeType.STRING),

  [AttributeType.BorderColor]: setAttributeParsingBehavior(AttributeType.BorderColor, SetAttributeType.STYLE, DEFAULT_IMAGE_BORDER_COLOR),
  [AttributeType.BorderStyle]: setAttributeParsingBehavior(AttributeType.BorderStyle, SetAttributeType.STYLE, DEFAULT_IMAGE_BORDER_STYLE),
  [AttributeType.BorderWidth]: setAttributeParsingBehavior(AttributeType.BorderWidth, SetAttributeType.STYLE, DEFAULT_IMAGE_BORDER_WIDTH),
  [AttributeType.Width]: setAttributeParsingBehavior(AttributeType.Width, SetAttributeType.STYLE, DEFAULT_IMAGE_WIDTH),
  [AttributeType.Height]: setAttributeParsingBehavior(AttributeType.Height, SetAttributeType.STYLE, DEFAULT_IMAGE_HEIGHT),
  [AttributeType.TextAlign]: setAttributeParsingBehavior(AttributeType.TextAlign, SetAttributeType.STYLE),
  [AttributeType.VerticalAlign]: setAttributeParsingBehavior(AttributeType.VerticalAlign, SetAttributeType.STYLE),
});

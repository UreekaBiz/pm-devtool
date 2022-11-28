import { AttributeType, BulletListAttributes, SetAttributeType } from 'common';

import { NodeExtensionAttributes } from 'notebookEditor/extension/type/NodeExtension/type';
import { setAttributeParsingBehavior } from 'notebookEditor/extension/util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const BulletListAttrs: NodeExtensionAttributes<BulletListAttributes> = {
  [AttributeType.MarginLeft]: setAttributeParsingBehavior(AttributeType.MarginLeft, SetAttributeType.STYLE),
};

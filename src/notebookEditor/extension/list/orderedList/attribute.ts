import { AttributeType, OrderedListAttributes, SetAttributeType, ORDERED_LIST_DEFAULT_START } from 'common';

import { NodeExtensionAttributes } from 'notebookEditor/extension/type/NodeExtension/type';
import { setAttributeParsingBehavior } from 'notebookEditor/extension/util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const OrderedListAttrs: NodeExtensionAttributes<OrderedListAttributes> = {
  [AttributeType.StartValue]: setAttributeParsingBehavior(AttributeType.StartValue, SetAttributeType.NUMBER, ORDERED_LIST_DEFAULT_START),
  [AttributeType.MarginLeft]: setAttributeParsingBehavior(AttributeType.MarginLeft, SetAttributeType.STRING),
};

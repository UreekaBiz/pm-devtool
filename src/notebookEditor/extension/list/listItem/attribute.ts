import { AttributeType, ListItemAttributes, ListStyle, SetAttributeType, DATA_LIST_ITEM_LIST_STYLE, LIST_ITEM_DEFAULT_SEPARATOR, DATA_LIST_ITEM_SEPARATOR } from 'common';

import { NodeExtensionAttributes } from 'notebookEditor/extension/type/NodeExtension/type';
import { setAttributeParsingBehavior } from 'notebookEditor/extension/util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const ListItemAttrs: NodeExtensionAttributes<ListItemAttributes> = {
  // NOTE: these attributes have influence in all ListItems
  [AttributeType.PaddingTop]: setAttributeParsingBehavior(AttributeType.PaddingTop, SetAttributeType.STRING),
  [AttributeType.PaddingBottom]: setAttributeParsingBehavior(AttributeType.PaddingBottom, SetAttributeType.STRING),

  // NOTE: these attributes only have influence on ListItems inside OrderedLists
  [AttributeType.ListStyleType]: setAttributeParsingBehavior(DATA_LIST_ITEM_LIST_STYLE, SetAttributeType.STRING, ListStyle.DECIMAL),
  [AttributeType.Separator]: setAttributeParsingBehavior(DATA_LIST_ITEM_SEPARATOR, SetAttributeType.STRING, LIST_ITEM_DEFAULT_SEPARATOR),
};

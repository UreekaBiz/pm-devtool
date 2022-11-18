import { AttributeType, HeaderCellAttributes, SetAttributeType, CELL_COL_SPAN, CELL_ROW_SPAN } from 'common';

import { NodeExtensionAttributes } from 'notebookEditor/extension/type/NodeExtension/type';
import { setAttributeParsingBehavior } from 'notebookEditor/extension/util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const HeaderCellAttrs: NodeExtensionAttributes<HeaderCellAttributes> = {
  [AttributeType.ColSpan]: setAttributeParsingBehavior(AttributeType.ColSpan, SetAttributeType.NUMBER, CELL_COL_SPAN),
  [AttributeType.RowSpan]: setAttributeParsingBehavior(AttributeType.RowSpan, SetAttributeType.NUMBER, CELL_ROW_SPAN),
  [AttributeType.ColWidth]: setAttributeParsingBehavior(AttributeType.ColWidth, SetAttributeType.ARRAY, null/*explicitly null as default*/, 'number'),
};

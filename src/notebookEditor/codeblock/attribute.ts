import { AttributeType, CodeBlockAttributes, CodeBlockType, SetAttributeType } from 'common';

import { setAttributeParsingBehavior, uniqueIdParsingBehavior } from 'notebookEditor/extension/util';

import { ExtensionStorageType, NodeExtensionAttributes } from 'notebookEditor/extension';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getCodeBlockAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<CodeBlockAttributes> =>  ({
  // creates a new Id for the Node when it is created
  [AttributeType.Id]: uniqueIdParsingBehavior(storage),

  [AttributeType.Type]: setAttributeParsingBehavior(AttributeType.Type, SetAttributeType.STRING, CodeBlockType.Code),
  [AttributeType.Wrap]: setAttributeParsingBehavior(AttributeType.Wrap, SetAttributeType.BOOLEAN, false/*default wrap for Code type is false*/),

  [AttributeType.PaddingTop]: setAttributeParsingBehavior(AttributeType.PaddingTop, SetAttributeType.STYLE),
  [AttributeType.PaddingBottom]: setAttributeParsingBehavior(AttributeType.PaddingBottom, SetAttributeType.STYLE),
  [AttributeType.PaddingLeft]: setAttributeParsingBehavior(AttributeType.PaddingLeft, SetAttributeType.STYLE),
  [AttributeType.PaddingRight]: setAttributeParsingBehavior(AttributeType.PaddingRight, SetAttributeType.STYLE),

  [AttributeType.MarginTop]: setAttributeParsingBehavior(AttributeType.MarginTop, SetAttributeType.STYLE),
  [AttributeType.MarginLeft]: setAttributeParsingBehavior(AttributeType.MarginLeft, SetAttributeType.STYLE),
  [AttributeType.MarginBottom]: setAttributeParsingBehavior(AttributeType.MarginBottom, SetAttributeType.STYLE),
  [AttributeType.MarginRight]: setAttributeParsingBehavior(AttributeType.MarginRight, SetAttributeType.STYLE),
});

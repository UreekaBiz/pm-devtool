import { AttributeType, CodeBlockReferenceAttributes, SetAttributeType } from 'common';

import { setAttributeParsingBehavior, uniqueIdParsingBehavior } from 'notebookEditor/extension/util';

import { ExtensionStorageType, NodeExtensionAttributes } from 'notebookEditor/extension';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getCodeBlockReferenceAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<CodeBlockReferenceAttributes> =>  ({
  // creates a new Id for the Node when it is created
  [AttributeType.Id]: uniqueIdParsingBehavior(storage),

  [AttributeType.LeftDelimiter]: setAttributeParsingBehavior(AttributeType.LeftDelimiter, SetAttributeType.STRING),
  [AttributeType.CodeBlockReference]: setAttributeParsingBehavior(AttributeType.CodeBlockReference, SetAttributeType.STRING),
  [AttributeType.RightDelimiter]: setAttributeParsingBehavior(AttributeType.RightDelimiter, SetAttributeType.STRING),
});

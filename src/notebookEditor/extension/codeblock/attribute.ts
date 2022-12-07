import { AttributeType, CodeBlockAttributes, CodeBlockLanguage, SetAttributeType } from 'common';

import { setAttributeParsingBehavior, uniqueIdParsingBehavior } from 'notebookEditor/extension/util';

import { ExtensionStorageType } from '../type/Extension/type';
import { NodeExtensionAttributes } from '../type/NodeExtension/type';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getCodeBlockAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<CodeBlockAttributes> =>  ({
  // creates a new Id for the Node when it is created
  [AttributeType.Id]: uniqueIdParsingBehavior(storage),

  [AttributeType.Language]: setAttributeParsingBehavior(AttributeType.Language, SetAttributeType.STRING, CodeBlockLanguage.JavaScript/*default*/),
});

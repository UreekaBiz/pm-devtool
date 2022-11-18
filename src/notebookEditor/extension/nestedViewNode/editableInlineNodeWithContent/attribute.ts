import { EditableInlineNodeWithContentAttributes, AttributeType } from 'common';

import { ExtensionStorageType } from 'notebookEditor/extension/type/Extension/type';
import { NodeExtensionAttributes } from 'notebookEditor/extension/type/NodeExtension/type';
import { uniqueIdParsingBehavior } from 'notebookEditor/extension/util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getEditableInlineNodeWithContentAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<EditableInlineNodeWithContentAttributes> => ({
  // creates a new Id for the node when it is created.
  [AttributeType.Id]: uniqueIdParsingBehavior(storage),
});

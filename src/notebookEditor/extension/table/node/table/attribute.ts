import { generateNodeId, AttributeType, TableAttributes } from 'common';

import { ExtensionStorageType } from 'notebookEditor/extension/type/Extension/type';
import { NodeExtensionAttributes } from 'notebookEditor/extension/type/NodeExtension/type';
import { uniqueIdParsingBehavior } from 'notebookEditor/extension/util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getTableAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<TableAttributes> =>  ({
  // creates a new Id for the Node when it is created
  [AttributeType.Id]:  {
    ...uniqueIdParsingBehavior(storage),

    // NOTE: since Cells may be pasted and wrapped in a Table, said table must receive an Id
    default: generateNodeId(),
  },
});

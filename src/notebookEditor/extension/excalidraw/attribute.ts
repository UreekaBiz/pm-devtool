import { AttributeType, ExcalidrawAttributes } from 'common';

import { ExtensionStorageType } from '../type/Extension/type';
import { NodeExtensionAttributes } from '../type/NodeExtension/type';
import { uniqueIdParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getExcalidrawAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<ExcalidrawAttributes> =>  ({
  // creates a new Id for the Node when it is created
  [AttributeType.Id]: uniqueIdParsingBehavior(storage),
});

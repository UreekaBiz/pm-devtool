import { DemoAsyncNode2Attributes, AttributeType, SetAttributeType, DEFAULT_DEMO_2_ASYNC_NODE_DELAY, DEFAULT_DEMO_2_ASYNC_NODE_STATUS } from 'common';

import { ExtensionStorageType } from '../type/Extension/type';
import { NodeExtensionAttributes } from '../type/NodeExtension/type';
import { setAttributeParsingBehavior, uniqueIdParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getDemoAsyncNode2Attrs = (storage: ExtensionStorageType): NodeExtensionAttributes<DemoAsyncNode2Attributes> =>  ({
  // creates a new Id for the Node when it is created
    [AttributeType.Id]: uniqueIdParsingBehavior(storage),

    [AttributeType.Delay]: setAttributeParsingBehavior(AttributeType.Delay, SetAttributeType.NUMBER, DEFAULT_DEMO_2_ASYNC_NODE_DELAY),
    [AttributeType.Status]: setAttributeParsingBehavior(AttributeType.Status, SetAttributeType.STRING, DEFAULT_DEMO_2_ASYNC_NODE_STATUS),

    [AttributeType.TextToReplace]: setAttributeParsingBehavior(AttributeType.TextToReplace, SetAttributeType.STRING),
});

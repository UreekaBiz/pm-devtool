import { DemoAsyncNodeAttributes, AttributeType, SetAttributeType, DEFAULT_DEMO_ASYNC_NODE_DELAY, DEFAULT_DEMO_ASYNC_NODE_STATUS, DEFAULT_DEMO_ASYNC_NODE_TEXT } from 'common';

import { ExtensionStorageType, NodeExtensionAttributes } from '../type';
import { setAttributeParsingBehavior, uniqueIdParsingBehavior } from '../util';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: extracted so that it can be used by both the attributes of the Extension
//       and added to all ParseRules of the parseDOM property
export const getDemoAsyncNodeAttrs = (storage: ExtensionStorageType): NodeExtensionAttributes<DemoAsyncNodeAttributes> =>  ({
  // creates a new Id for the Node when it is created
  [AttributeType.Id]: uniqueIdParsingBehavior(storage),

  [AttributeType.CodeBlockReferences]: setAttributeParsingBehavior(AttributeType.CodeBlockReferences, SetAttributeType.ARRAY, [/*default empty*/]),
  [AttributeType.CodeBlockHashes]: setAttributeParsingBehavior(AttributeType.CodeBlockHashes, SetAttributeType.ARRAY, [/*default empty*/]),

  [AttributeType.Status]: setAttributeParsingBehavior(AttributeType.Status, SetAttributeType.STRING, DEFAULT_DEMO_ASYNC_NODE_STATUS),
  [AttributeType.Text]: setAttributeParsingBehavior(AttributeType.Text, SetAttributeType.STRING, DEFAULT_DEMO_ASYNC_NODE_TEXT),

  [AttributeType.Delay]: setAttributeParsingBehavior(AttributeType.Delay, SetAttributeType.NUMBER, DEFAULT_DEMO_ASYNC_NODE_DELAY),
});


import { noNodeOrMarkSpecAttributeDefaultValue, AttributesTypeFromNodeSpecAttributes, AttributeType } from '../../attribute';
import { AsyncNodeAttributeSpec, AsyncNodeStatus, createDefaultAsyncNodeAttributes } from '../asyncNode';
import { CodeBlockHash } from '../codeBlock';
import { CodeBlockReference } from '../codeBlockReference';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: must be present on the NodeSpec below
// NOTE: This values must have matching types the ones defined in the Extension
export const DemoAsyncNodeAttributeSpec = {
  ...AsyncNodeAttributeSpec,

  /** the array of nodeIdentifiers that the async node is listening to */
  [AttributeType.CodeBlockReferences]: noNodeOrMarkSpecAttributeDefaultValue<CodeBlockReference[]>(),

  /** the array of strings containing the hashes of the textContent of each corresponding CodeBlockReference*/
  [AttributeType.CodeBlockHashes]: noNodeOrMarkSpecAttributeDefaultValue<CodeBlockHash[]>(),

  /** the resulting value of the executed function */
  [AttributeType.Text]: noNodeOrMarkSpecAttributeDefaultValue<string>(),

  /** the delay for the execution of the DAN */
  [AttributeType.Delay]: noNodeOrMarkSpecAttributeDefaultValue<number>(),
};
export type DemoAsyncNodeAttributes = AttributesTypeFromNodeSpecAttributes<typeof DemoAsyncNodeAttributeSpec>;

// == Util ========================================================================
export const createDefaultDemoAsyncNodeAttributes = (): Partial<DemoAsyncNodeAttributes> => ({
  ...createDefaultAsyncNodeAttributes(),
  [AttributeType.CodeBlockReferences]: [/*empty*/],
  [AttributeType.CodeBlockHashes]: [/*empty*/],
  [AttributeType.Status]: DEFAULT_DEMO_ASYNC_NODE_STATUS,
  [AttributeType.Delay]: DEFAULT_DEMO_ASYNC_NODE_DELAY,
  [AttributeType.Text]: DEFAULT_DEMO_ASYNC_NODE_TEXT,
});

export const DEFAULT_DEMO_ASYNC_NODE_STATUS = AsyncNodeStatus.NEVER_EXECUTED/*alias*/;
export const DEFAULT_DEMO_ASYNC_NODE_TEXT = 'Not Executed'/*creation default*/;
export const DEFAULT_DEMO_ASYNC_NODE_DELAY = 4000/*ms*/;

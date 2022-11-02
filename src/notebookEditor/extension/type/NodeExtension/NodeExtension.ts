import { Extension } from '../Extension';
import { NodeExtensionDefinition, NodeExtensionNodeSpec } from './type';

// ********************************************************************************
// == Class =======================================================================
export class NodeExtension extends Extension {
  // -- Attribute -----------------------------------------------------------------
  public nodeSpec: NodeExtensionNodeSpec;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(definition: NodeExtensionDefinition) {
    super(definition);

    const nodeAttributeDefinition = definition.defineNodeAttributes(this.storage);
    const nodeDOMBehavior = definition.defineDOMBehavior(this.storage);

    this.nodeSpec = {
      ...definition.partialNodeSpec,
      attrs: { ...nodeAttributeDefinition },
      ...nodeDOMBehavior,
    };
  }
}

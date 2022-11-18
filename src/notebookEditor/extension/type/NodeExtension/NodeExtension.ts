import { Extension } from '../Extension/Extension';
import { NodeExtensionDefinition, NodeExtensionNodeSpec } from './type';

// ********************************************************************************
// == Class =======================================================================
export class NodeExtension extends Extension {
  // -- Attribute -----------------------------------------------------------------
  public definition: NodeExtensionDefinition;
  public nodeSpec: NodeExtensionNodeSpec;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(definition: NodeExtensionDefinition) {
    super(definition);
    this.definition = definition;

    const nodeAttributeDefinition = definition.defineNodeAttributes(this.storage);
    const nodeDOMBehavior = definition.defineDOMBehavior(this.storage);

    this.nodeSpec = {
      ...definition.partialNodeSpec,
      attrs: { ...nodeAttributeDefinition },
      ...nodeDOMBehavior,
    };
  }
}

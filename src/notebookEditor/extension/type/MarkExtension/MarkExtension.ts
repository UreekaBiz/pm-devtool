import { Extension } from '../Extension/Extension';
import { MarkExtensionDefinition, MarkExtensionMarkSpec } from './type';

// ********************************************************************************
// == Class =======================================================================
export class MarkExtension extends Extension {
  // -- Attribute -----------------------------------------------------------------
  public markSpec: MarkExtensionMarkSpec;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(definition: MarkExtensionDefinition) {
    super(definition);

    const markAttributesDefinition = definition.defineMarkAttributes(this.storage);
    const markDOMBehavior = definition.defineDOMBehavior(this.storage);

    this.markSpec = {
      ...definition.partialMarkSpec,
      attrs: { ...markAttributesDefinition },
      ...markDOMBehavior,
    };
  }
}

import { ExtensionDefinition, ExtensionStorageType } from './type';

// ********************************************************************************
// == Class =======================================================================
export class Extension {
  // -- Attribute -----------------------------------------------------------------
  public name: string;
  public priority: number;
  public storage: ExtensionStorageType;
  public definition: ExtensionDefinition;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(definition: ExtensionDefinition) {
    this.name = definition.name;
    this.priority = definition.priority;

    if(definition.addStorage) {
      this.storage = definition.addStorage();
    } /* else -- Extension does not define a Storage */

    this.definition = definition;
  }
}

import { ExtensionDefinition, ExtensionStorageType } from './type';

// ********************************************************************************
// == Class =======================================================================
export class Extension {
  // -- Attribute -----------------------------------------------------------------
  // FIXME: make it a MarkName | NodeName | ExtensionName?
  public name: string;
  // FIXME: make it an Enum?
  public priority: number;
  public storage: ExtensionStorageType;
  public definition: ExtensionDefinition;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(definition: ExtensionDefinition) {
    this.definition = definition;

    this.name = definition.name;
    this.priority = definition.priority;

    if(definition.addStorage) {
      this.storage = definition.addStorage();
    } /* else -- Extension doesn't have a defined Storage */
  }
}

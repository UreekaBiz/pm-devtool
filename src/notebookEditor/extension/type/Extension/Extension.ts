import { MarkName, NodeName } from 'common';

import { ExtensionName, ExtensionPriority } from 'notebookEditor/model';

import { ExtensionDefinition, ExtensionStorageType } from './type';

// ********************************************************************************
// == Class =======================================================================
export class Extension {
  // -- Attribute -----------------------------------------------------------------
  public name: ExtensionName | NodeName | MarkName;
  public priority: ExtensionPriority;
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

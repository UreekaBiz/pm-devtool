import { AsyncNodeStatus, DemoAsyncNodeType } from 'common';

import { AbstractAsyncNodeModel } from 'notebookEditor/extension/asyncNode/nodeView/model';

import { DemoAsyncNodeStorageType } from './controller';

// ********************************************************************************
export class DemoAsyncNodeModel extends AbstractAsyncNodeModel<string, DemoAsyncNodeType, DemoAsyncNodeStorageType> {
  // == Abstract Methods ==========================================================
  /**
   * return the actual promise that gets the value to be rendered by the Node
   * and will be executed by the executeAsyncCall method
   */
  protected createPromise() {
    try {
      const chance = Math.random(),
            log = `${chance < 0.25 ? 'Failure' : 'Success'}: The current time is ${new Date().toISOString()}`;

      return new Promise<string>((resolve) => setTimeout(() => resolve(log), this.node.attrs.delay));
    } catch(error) {
      return `Failure: The current time is ${new Date().toISOString()}`;
    }
  }

  /** compute a state based on the result given by createPromise */
  protected getStatusFromResult(result: string) {
    if(typeof result !== 'string') throw new Error('Invalid result for DemoAsyncNodeView getStatusFromResult');
    const newStatus = result.includes('Failure:') ? AsyncNodeStatus.ERROR : AsyncNodeStatus.SUCCESS;
    return newStatus;
  }
}

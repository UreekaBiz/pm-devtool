import { AsyncNodeStatus, DemoAsyncNode2Type, AttributeType } from 'common';

import { AbstractAsyncNodeModel } from 'notebookEditor/extension/asyncNode/nodeView/model';

import { DemoAsyncNode2StorageType } from './controller';

// ********************************************************************************
export class DemoAsyncNode2Model extends AbstractAsyncNodeModel<string, DemoAsyncNode2Type, DemoAsyncNode2StorageType> {
  // == Abstract Methods ==========================================================
  // creates a promise that returns a random string after 2 seconds
  protected createPromise() {
    return new Promise<string>((resolve) => {
      const length = Math.floor(Math.random() * (100/*T&E*/) + 1);
      const string = createRandomString(length);
      const delay = this.node.attrs[AttributeType.Delay] ?? 0/*default*/;
      setTimeout(() => resolve(string), delay);
    });
  }

  /** get status from result for a DAN2 */
  protected getStatusFromResult(result: string) {
    return AsyncNodeStatus.SUCCESS/*default for D2AN*/;
  }

  /** check if DAN2 is dirty */
  public isAsyncNodeDirty(): boolean {
    return false/*default*/;
  }
}

// == Util ==============================================================================
// -- Promise ---------------------------------------------------------------------------
const randomStringChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const createRandomString = (length: number) => {
  let result = '';
  for( let i = 0; i < length; i++ ) {
    result += randomStringChars.charAt(Math.floor(Math.random() * randomStringChars.length));
  }
  return result;
};

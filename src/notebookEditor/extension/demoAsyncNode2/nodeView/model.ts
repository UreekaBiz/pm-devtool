import { AsyncNodeStatus, DemoAsyncNode2Type, AttributeType } from 'common';

import { AbstractAsyncNodeModel } from 'notebookEditor/extension/asyncNode/nodeView/model';

import { asyncReplaceDemoAsyncNode2ContentCommand } from '../command';
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

  /** Replaces the first instance of the text to be replaced with the replacement
   * text and wrap it around a {@link ReplacedTextMark}. */
  public async executeAsyncCall(): Promise<boolean> {
    try {
      const textContent = this.node.textContent,
            textToReplace = this.node.attrs[AttributeType.TextToReplace];

      // get the result from the promise
      const result = await this.createPromise();

      // replace the Text and wrap it around the Mark
      asyncReplaceDemoAsyncNode2ContentCommand(this.getPos(), textContent, textToReplace, result)(this.editor.view.state, this.editor.view.dispatch);
    } catch(error) {
      // node got deleted while performing the replacement call
      console.warn(error);
      return false/*view not updated*/;
    }
    return true/*view updated*/;
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

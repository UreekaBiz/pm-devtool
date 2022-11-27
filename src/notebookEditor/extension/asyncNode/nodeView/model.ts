import { getPosType, AsyncNodeType, AsyncNodeStatus, isAsyncNode, AttributeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { getCodeBlockViewStorage } from 'notebookEditor/extension/codeblock/nodeView/storage';
import { AbstractNodeModel } from 'notebookEditor/model/AbstractNodeModel';

import { replaceAsyncNodeCommand } from '../command';
import { codeBlockHash, hashesFromCodeBlockReferences } from '../util';
import { AbstractAsyncNodeStorageType } from './controller';

// ********************************************************************************
// == Class =======================================================================
/** Abstract class that serves as the base model for all Async nodes */
export abstract class AbstractAsyncNodeModel<T, NodeType extends AsyncNodeType, Storage extends AbstractAsyncNodeStorageType> extends AbstractNodeModel<AsyncNodeType, AbstractAsyncNodeStorageType> {
  // -- Attribute -----------------------------------------------------------------
  // defines if the current Node is performing an async operation
  // NOTE: This value must be set only by the executeAsyncCall method.
  private performingAsyncOperation: boolean;

  // the content that generated the previous async call has changed
  private isDirty: boolean;

  // -- Lifecycle -----------------------------------------------------------------
  public constructor(editor: Editor, node: NodeType, storage: Storage, getPos: getPosType) {
    super(editor, node, storage, getPos);

    this.performingAsyncOperation = false;
    this.isDirty = false/*initially dirty by contract*/;
  }
  // == Abstract ==================================================================
  // returns the actual promise that gets the value to be rendered by the node and
  // will be executed by the executeAsyncCall method.
  protected abstract createPromise(): Promise<T> | T;

  // computes a state based on the result given by createPromise.
  protected abstract getStatusFromResult(result: T): AsyncNodeStatus;


  // == Async =====================================================================
  public async executeAsyncCall() {
    // NOTE: Hashes must be computed before the async call is executed, because the
    //       code blocks can change during the async call.
    const hashes = hashesFromCodeBlockReferences(this.editor, this.node.attrs.codeBlockReferences);

    const result = await this.createPromise();

    // if the Node that initiated the async call no longer exists by the time
    // the async call resolves, PM handles the removal of all of its view
    // components and syncs the Editor state. Hence the only thing that must
    // be done is to -not- make the replacement call by returning false from the
    // executeAsyncCall that had been scheduled previously
    if(!this.getPos() || !isAsyncNode(this.node)) {
      return false/*node view not updated*/;
    } /* else -- node still exists */

    // get the status based on the implementation of the AbstractAsyncNodeView
    const status = this.getStatusFromResult(result);
    const node = this.node.type.create({
      ...this.node.attrs,
      [AttributeType.CodeBlockHashes]: hashes,
      [AttributeType.Status]: status,
      [AttributeType.Text]: String(result),
    }, this.node.content);

    const viewWasUpdated = this.replaceAsyncNode(this.editor, node as AsyncNodeType/*by definition*/, this.getPos());
    return viewWasUpdated;
  }

  // == Replace ===================================================================
  /** replace the AsyncNode */
  protected replaceAsyncNode(editor: Editor, node: AsyncNodeType, position: number): boolean {
    return replaceAsyncNodeCommand(node, position)(editor.view.state, editor.view.dispatch);
  }
  // == Model =====================================================================
  // -- Get -----------------------------------------------------------------------
  public getIsDirty() { return this.isDirty; }
  public getPerformingAsyncOperation() { return this.performingAsyncOperation; }

  // -- Set -----------------------------------------------------------------------
  public setIsDirty(isDirty: boolean) { this.isDirty = isDirty; }
  public setPerformingAsyncOperation(performingAsyncOperation: boolean) { this.performingAsyncOperation = performingAsyncOperation; }

  // -- Dirty ---------------------------------------------------------------------
  // asyncNodes share this logic for checking if they are dirty
  // (SEE: checkDirty.ts)
  public isAsyncNodeDirty() {
    const { codeBlockReferences, codeBlockHashes } = this.node.attrs,
      codeBlockViewStorage = getCodeBlockViewStorage(this.editor);

    let isDirty = false/*default*/;
    if(codeBlockReferences.length !== codeBlockHashes.length) {
      isDirty = true;
    } /* else -- do not change default */

    for(let j = 0; j < codeBlockReferences.length; j++) {
      // -- check if node is not dirty already ------------------------------------
      if(isDirty) {
        break/*already know node is dirty*/;
      } /* else -- same amount of references and hashes */

      // -- check that codeBlock exists -----------------------------------------
      const referencedCodeBlockView = codeBlockViewStorage.getNodeView(codeBlockReferences[j]);
      if(!referencedCodeBlockView) {
        isDirty = true/*reference no longer exists*/;
        break/*nothing else to check*/;
      } /* else -- reference still exists */

      // -- check that hash matches ---------------------------------------------
      if(codeBlockHash(referencedCodeBlockView.node) !== codeBlockHashes[j]) {
        isDirty = true/*order of hashes is different or content changed*/;
        break/*nothing else to check*/;
      } /* else -- hash matches, node is not dirty */
    }

    return isDirty;
  }
}

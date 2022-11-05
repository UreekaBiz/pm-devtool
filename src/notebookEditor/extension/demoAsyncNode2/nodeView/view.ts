import { getPosType, DemoAsyncNode2Type, NodeName, DATA_NODE_TYPE  } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractAsyncNodeView } from 'notebookEditor/extension/asyncNode';

import { DemoAsyncNode2StorageType } from './controller';
import { DemoAsyncNode2Model } from './model';

// ********************************************************************************
// == Class =======================================================================
export class DemoAsyncNode2View extends AbstractAsyncNodeView<string, DemoAsyncNode2Type, DemoAsyncNode2StorageType, DemoAsyncNode2Model> {
  /** the container where the content of the CodeBlock is rendered */
  public readonly contentDOM: HTMLElement;

  // == Lifecycle =================================================================
  public constructor(model: DemoAsyncNode2Model, editor: Editor, node: DemoAsyncNode2Type, storage: DemoAsyncNode2StorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // -- UI ----------------------------------------------------------------------
    this.contentDOM = document.createElement('div');
    this.dom.appendChild(this.contentDOM);

    // sync View with current state
    this.updateView();
  }

  // -- Creation ------------------------------------------------------------------
  protected createDomElement() {
    const outerContainer = document.createElement('div');
          outerContainer.setAttribute(DATA_NODE_TYPE, NodeName.DEMO_ASYNC_NODE_2);
    return outerContainer;
  }

  // -- Update --------------------------------------------------------------------
  public updateView() {
    // update DOM
    const performingAsyncOperation = this.model.getPerformingAsyncOperation();
    this.dom.style.background= performingAsyncOperation ? 'rgba(0,0,0,0.3)': 'rgba(0,0,0,0.1)';

    // disable/enable the view if the model is performing an async operation
    // NOTE: while the Demo2AsyncNode is performing an async operation an
    //       onTransaction handler (SEE: AsyncNode.ts) prevents any transactions
    //       that modify the content of the Demo2AsyncNode from being applied
    this.contentDOM.setAttribute('contenteditable', performingAsyncOperation ? 'false' : 'true');

    // NOTE: ProseMirror adds white-space: normal to non editable nodes, this causes
    //       the node to lose its white-space while its being executed. The solution
    //       is to overwrite that property on this specific case. */
    this.contentDOM.style.whiteSpace = 'pre-wrap';
  }
}

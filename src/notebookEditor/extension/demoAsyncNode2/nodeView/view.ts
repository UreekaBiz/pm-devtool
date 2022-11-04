import { getPosType, DemoAsyncNode2Type, NodeName, DATA_NODE_TYPE  } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractAsyncNodeView } from 'notebookEditor/extension/asyncNode';

import { DemoAsyncNode2StorageType } from './controller';
import { DemoAsyncNode2Model } from './model';

// ********************************************************************************
// == Class =======================================================================
export class DemoAsyncNode2View extends AbstractAsyncNodeView<string, DemoAsyncNode2Type, DemoAsyncNode2StorageType, DemoAsyncNode2Model> {
  // == Lifecycle =================================================================
  public constructor(model: DemoAsyncNode2Model, editor: Editor, node: DemoAsyncNode2Type, storage: DemoAsyncNode2StorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

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
    this.dom.style.background= this.model.getPerformingAsyncOperation() ? 'rgba(0,0,0,0.3)': 'rgba(0,0,0,0.1)';
  }
}

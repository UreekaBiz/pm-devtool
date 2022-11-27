import { asyncNodeStatusToColor, getPosType, AsyncNodeStatus, AttributeType, DemoAsyncNodeType, NodeName, DATA_NODE_TYPE, DEMO_ASYNC_NODE_STATUS_CONTAINER_CLASS } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractAsyncNodeView } from 'notebookEditor/extension/asyncNode/nodeView/view';
import { createInlineNodeContainer } from 'notebookEditor/extension/util/ui';

import { DemoAsyncNodeStorageType } from './controller';
import { DemoAsyncNodeModel } from './model';

// ********************************************************************************
// == Class =======================================================================
export class DemoAsyncNodeView extends AbstractAsyncNodeView<string, DemoAsyncNodeType, DemoAsyncNodeStorageType, DemoAsyncNodeModel> {
  // -- Lifecycle -----------------------------------------------------------------
  constructor(model: DemoAsyncNodeModel, editor: Editor, node: DemoAsyncNodeType, storage: DemoAsyncNodeStorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // -- UI ----------------------------------------------------------------------
    // sync View with current state
    this.updateView();
  }

  // -- Creation ------------------------------------------------------------------
  protected createDomElement(): HTMLElement {
    const dom = createInlineNodeContainer();
          dom.setAttribute(DATA_NODE_TYPE, NodeName.DEMO_ASYNC_NODE);
    return dom;
  }

  // -- Update --------------------------------------------------------------------
  public updateView() {
    const { attrs } = this.node;
    const status = this.model.getPerformingAsyncOperation()
      ? AsyncNodeStatus.PROCESSING
      : attrs[AttributeType.Status] ?? AsyncNodeStatus.NEVER_EXECUTED/*default value*/;
    const text = attrs[AttributeType.Text] ?? ''/*default value*/;
    const statusColor = asyncNodeStatusToColor(status);

    // update DOM
    const isDirty = this.model.getIsDirty();
    this.dom.style.borderColor = isDirty ? 'red' : '#CBD5E0'/*default*/;

    // update contentDOM
    this.dom.innerText = text;

    // update status container
    const statusContainer = document.createElement('div');
          statusContainer.classList.add(DEMO_ASYNC_NODE_STATUS_CONTAINER_CLASS);
          statusContainer.style.backgroundColor = statusColor;
    this.dom.appendChild(statusContainer);
  }
}

import { asyncNodeStatusToColor, getPosType, AsyncNodeStatus, AttributeType, DemoAsyncNodeType, NodeName, DATA_NODE_TYPE, DEMO_ASYNC_NODE_STATUS_CONTAINER_CLASS } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractAsyncNodeView } from 'notebookEditor/extension/asyncNode/nodeView/view';
import { createInlineNodeContainer } from 'notebookEditor/extension/util/ui';

import { DemoAsyncNodeStorageType } from './controller';
import { DemoAsyncNodeModel } from './model';

// ********************************************************************************
// == Class =======================================================================
export class DemoAsyncNodeView extends AbstractAsyncNodeView<string, DemoAsyncNodeType, DemoAsyncNodeStorageType, DemoAsyncNodeModel> {
  // -- Attribute -----------------------------------------------------------------
  /** the div that holds the Text content of the DAN */
  public readonly contentDOM: HTMLSpanElement;

  /** the div that holds the status of the DAN */
  public readonly statusContainer: HTMLDivElement;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(model: DemoAsyncNodeModel, editor: Editor, node: DemoAsyncNodeType, storage: DemoAsyncNodeStorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // -- UI ----------------------------------------------------------------------
    this.contentDOM = document.createElement('span');
    this.dom.appendChild(this.contentDOM);

    this.statusContainer = document.createElement('div');
    this.statusContainer.classList.add(DEMO_ASYNC_NODE_STATUS_CONTAINER_CLASS);
    this.dom.appendChild(this.statusContainer);

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
    this.contentDOM.innerText = text;

    // update status container
    this.statusContainer.style.backgroundColor = statusColor;
  }
}

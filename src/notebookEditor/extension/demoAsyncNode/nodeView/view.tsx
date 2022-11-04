import { getPosType, DemoAsyncNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractAsyncNodeView } from 'notebookEditor/extension/asyncNode/nodeView/view';
import { createInlineNodeContainer } from 'notebookEditor/extension/util/ui';
import { WrapReactNodeView } from 'notebookEditor/model/ReactNodeView';

import { DemoAsyncNodeStorageType } from './controller';
import { DemoAsyncNodeComponent, DemoAsyncNodeComponentProps } from './jsx';
import { DemoAsyncNodeModel } from './model';

// ********************************************************************************
// == Class =======================================================================
export class DemoAsyncNodeView extends AbstractAsyncNodeView<string, DemoAsyncNodeType, DemoAsyncNodeStorageType, DemoAsyncNodeModel> {
  // -- Lifecycle -----------------------------------------------------------------
  constructor(model: DemoAsyncNodeModel, editor: Editor, node: DemoAsyncNodeType, asyncNodeStorage: DemoAsyncNodeStorageType, getPos: getPosType) {
    super(model, editor, node, asyncNodeStorage, getPos);

    // .. UI ......................................................................
    this.reactNodeView = (props) => WrapReactNodeView(
      null/*no contentDOM*/,
      props,
      // FIXME: Types!
      (props) => <DemoAsyncNodeComponent {...props as unknown as DemoAsyncNodeComponentProps} />,
      {/*no options*/}
    );

    // Sync view with current state
    this.updateView();
  }

  // == View ======================================================================
  // creates the DOM element that will be used to display the node's content
  protected createDomElement(): HTMLElement {
    return createInlineNodeContainer();
  }
}

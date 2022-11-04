import { getPosType, DemoAsyncNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractAsyncNodeController } from 'notebookEditor/extension/asyncNode/nodeView/controller';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { DemoAsyncNodeModel } from './model';
import { DemoAsyncNodeView } from './view';

// ********************************************************************************
export type DemoAsyncNodeStorageType = NodeViewStorage<DemoAsyncNodeController>
export class DemoAsyncNodeController extends AbstractAsyncNodeController<string, DemoAsyncNodeType, DemoAsyncNodeStorageType, DemoAsyncNodeModel, DemoAsyncNodeView> {
  // == Life-cycle ================================================================
  public constructor(editor: Editor, node: DemoAsyncNodeType, storage: DemoAsyncNodeStorageType, getPos: getPosType) {
    const model = new DemoAsyncNodeModel(editor, node, storage, getPos),
          view = new DemoAsyncNodeView(model, editor, node, storage, getPos);

    super(model, view, editor, node, storage, getPos);
  }
}

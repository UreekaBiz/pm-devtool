import { getPosType, DemoAsyncNode2Type } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractAsyncNodeController } from 'notebookEditor/extension/asyncNode/nodeView/controller';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { DemoAsyncNode2Model } from './model';
import { DemoAsyncNode2View } from './view';

// ********************************************************************************
export type DemoAsyncNode2StorageType = NodeViewStorage<DemoAsyncNode2Controller>;
export class DemoAsyncNode2Controller extends AbstractAsyncNodeController<string, DemoAsyncNode2Type, DemoAsyncNode2StorageType, DemoAsyncNode2Model, DemoAsyncNode2View> {
  // == Life-cycle ================================================================
  public constructor(editor: Editor, node: DemoAsyncNode2Type, storage: DemoAsyncNode2StorageType, getPos: getPosType) {
    const model = new DemoAsyncNode2Model(editor, node, storage, getPos),
          view = new DemoAsyncNode2View(model, editor, node, storage, getPos);
    super(model, view, editor, node, storage, getPos);
  }

  // .. Mutation ..................................................................
  /** ignore mutations that modify the attributes of the DAN2 */
   public ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Element; }) {
    // ignore if modifying the Attributes of the Node. This specifically prevents
    // the logical NodeView getting destroyed whenever the DAN2 is executed
    return (mutation.type === 'attributes');
  }
}

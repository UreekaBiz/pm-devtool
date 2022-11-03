
import { getPosType, NestedViewBlockNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNestedNodeViewNodeController } from 'notebookEditor/extension/nestedViewNode/nodeView/controller';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { NestedViewBlockNodeModel } from './model';
import { NestedViewBlockNodeView } from './view';

// ********************************************************************************
// == Storage =====================================================================
export type NestedViewBlockNodeStorageType = NodeViewStorage<NestedViewBlockNodeController>

// == Controller ==================================================================
export class NestedViewBlockNodeController extends AbstractNestedNodeViewNodeController<NestedViewBlockNodeType, NestedViewBlockNodeStorageType, NestedViewBlockNodeModel, NestedViewBlockNodeView> {
  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: NestedViewBlockNodeType, storage: NestedViewBlockNodeStorageType, getPos: getPosType) {
    const model = new NestedViewBlockNodeModel(editor, node, storage, getPos),
          view = new NestedViewBlockNodeView(model, editor, node, storage, getPos);

    super(model, view, editor, node, storage, getPos);
  }
}

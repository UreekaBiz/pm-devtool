import { getPosType, NestedViewBlockNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNestedViewNodeView } from 'notebookEditor/extension/nestedViewNode/nodeView/view';

import { NestedViewBlockNodeModel } from './model';
import { NestedViewBlockNodeStorageType } from './controller';

// ********************************************************************************
export class NestedViewBlockNodeView extends AbstractNestedViewNodeView<NestedViewBlockNodeType, NestedViewBlockNodeStorageType, NestedViewBlockNodeModel> {
  // == Lifecycle =================================================================
  public constructor(model: NestedViewBlockNodeModel, editor: Editor, node: NestedViewBlockNodeType, storage: NestedViewBlockNodeStorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // currently nothing else required
  }
}

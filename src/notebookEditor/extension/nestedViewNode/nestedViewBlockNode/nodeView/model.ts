
import { getPosType, NestedViewBlockNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNestedViewNodeModel } from 'notebookEditor/extension/nestedViewNode/nodeView/model';

import { NestedViewBlockNodeStorageType } from './controller';

// ********************************************************************************
export class NestedViewBlockNodeModel extends AbstractNestedViewNodeModel<NestedViewBlockNodeType, NestedViewBlockNodeStorageType> {
  public constructor(editor: Editor, node: NestedViewBlockNodeType, storage: NestedViewBlockNodeStorageType, getPos: getPosType) {
    super(editor, node, storage, getPos);

    // currently nothing else required
  }
}

import { getPosType, CodeBlockReferenceNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNodeController } from 'notebookEditor/model/AbstractNodeController';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { CodeBlockReferenceModel } from './model';
import { CodeBlockReferenceView } from './view';

// ********************************************************************************
export type CodeBlockReferenceStorageType = NodeViewStorage<CodeBlockReferenceController>;
export class CodeBlockReferenceController extends AbstractNodeController<CodeBlockReferenceNodeType, CodeBlockReferenceStorageType, CodeBlockReferenceModel, CodeBlockReferenceView> {
  // == Life-cycle ================================================================
  public constructor(editor: Editor, node: CodeBlockReferenceNodeType, storage: CodeBlockReferenceStorageType, getPos: getPosType) {
    const model = new CodeBlockReferenceModel(editor, node, storage, getPos),
          view = new CodeBlockReferenceView(model, editor, node, storage, getPos);

    super(model, view, editor, node, storage, getPos);
  }
}

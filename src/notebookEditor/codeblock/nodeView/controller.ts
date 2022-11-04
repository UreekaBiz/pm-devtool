import { getPosType, CodeBlockNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNodeController } from 'notebookEditor/model/AbstractNodeController';

import { CodeBlockModel } from './model';
import { CodeBlockStorage } from './storage';
import { CodeBlockView } from './view';

// ********************************************************************************
export class CodeBlockController extends AbstractNodeController<CodeBlockNodeType, CodeBlockStorage, CodeBlockModel, CodeBlockView> {
  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: CodeBlockNodeType, codeBlockStorage: CodeBlockStorage, getPos: getPosType) {
    const model = new CodeBlockModel(editor, node, codeBlockStorage, getPos),
          view = new CodeBlockView(model, editor, node, codeBlockStorage, getPos);

    super(model, view, editor, node, codeBlockStorage, getPos);
  }
}

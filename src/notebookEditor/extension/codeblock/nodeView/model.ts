import { getPosType, CodeBlockNodeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeModel } from 'notebookEditor/model/AbstractNodeModel';

import { CodeBlockStorage } from './storage';

// == View ========================================================================
export class CodeBlockModel extends AbstractNodeModel<CodeBlockNodeType, CodeBlockStorage> {
  // == Attribute =================================================================
  // whether or not the Node is currently being updated
	public isUpdating: boolean;

  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: CodeBlockNodeType, storage: CodeBlockStorage, getPos: getPosType) {
    super(editor, node, storage, getPos);
		this.isUpdating = false/*default*/;
  }
}

import { Compartment } from '@codemirror/state';

import { getPosType, CodeBlockNodeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeModel } from 'notebookEditor/model/AbstractNodeModel';

import { CodeBlockStorage } from './storage';

// == View ========================================================================
export class CodeBlockModel extends AbstractNodeModel<CodeBlockNodeType, CodeBlockStorage> {
  // == Attribute =================================================================
  /** used to avoid a loop between the outer and inner Editor */
  public isUpdating: boolean;

  /** the currently used Language */
  public languageCompartment: Compartment;

  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: CodeBlockNodeType, storage: CodeBlockStorage, getPos: getPosType) {
    super(editor, node, storage, getPos);

    this.isUpdating = false/*default*/;
    this.languageCompartment = new Compartment();
  }
}

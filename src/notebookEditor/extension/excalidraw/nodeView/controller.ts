import { getPosType, ExcalidrawNodeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeController } from 'notebookEditor/model';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';
import { Node } from 'prosemirror-model';
import { createElement } from 'react';
import { ExcalidrawApp } from './excalidrawApp';

import { ExcalidrawModel } from './model';
import { ExcalidrawView } from './view';

// ********************************************************************************
export type ExcalidrawStorageType = NodeViewStorage<ExcalidrawController>
export class ExcalidrawController extends AbstractNodeController<ExcalidrawNodeType, ExcalidrawStorageType, ExcalidrawModel, ExcalidrawView> {
  // == Life-cycle ================================================================
  public constructor(editor: Editor, node: ExcalidrawNodeType, storage: ExcalidrawStorageType, getPos: getPosType) {
    const model = new ExcalidrawModel(editor, node, storage, getPos),
          view = new ExcalidrawView(model, editor, node, storage, getPos);

    super(model, view, editor, node, storage, getPos);
  }

  // .. Update ....................................................................
  public update(node: Node): boolean {
    const result = super.update(node);
    if(!result) return false;

    this.nodeView.excalidrawRoot.render(createElement(ExcalidrawApp, {
      view: this.editor.view,
      node: this.node,
    }));
    return result;
  }

  // .. Mutation ..................................................................
  /** @see NodeView#ignoreMutation() */
   public ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Element; }) {
    // ignore all mutations coming from within Excalidraw
    return true;
  }
}

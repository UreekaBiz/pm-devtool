import { getPosType, ImageNodeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeController } from 'notebookEditor/model/AbstractNodeController';

import { ImageModel } from './model';
import { ImageStorage } from './storage';
import { ImageView } from './view';

// ********************************************************************************
export class ImageController extends AbstractNodeController<ImageNodeType, ImageStorage, ImageModel, ImageView> {
  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: ImageNodeType, storage: ImageStorage, getPos: getPosType) {
    const model = new ImageModel(editor, node, storage, getPos),
          view = new ImageView(model, editor, node, storage, getPos);

    super(model, view, editor, node, storage, getPos);
    this.nodeView.updateView();
  }
}

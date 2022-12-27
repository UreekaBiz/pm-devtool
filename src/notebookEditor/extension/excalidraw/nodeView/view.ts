import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { getPosType, NodeName, ExcalidrawNodeType, DATA_NODE_TYPE } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { createInlineNodeContainer } from 'notebookEditor/extension/util/ui';
import { AbstractNodeView } from 'notebookEditor/model';

import { ExcalidrawStorageType } from './controller';
import { ExcalidrawModel } from './model';
import { ExcalidrawApp } from './ExcalidrawApp';

// ********************************************************************************
// == Class =======================================================================
export class ExcalidrawView extends AbstractNodeView<ExcalidrawNodeType, ExcalidrawStorageType, ExcalidrawModel> {
  // -- Attribute -----------------------------------------------------------------
  /** the div holding the Excalidraw React container */
  public excalidrawWrapper: HTMLElement;

  /** the Excalidraw React-Root */
  public excalidrawRoot: Root;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(model: ExcalidrawModel, editor: Editor, node: ExcalidrawNodeType, storage: ExcalidrawStorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // -- UI ----------------------------------------------------------------------
    this.excalidrawWrapper = this.dom;
    this.excalidrawRoot = createRoot(this.excalidrawWrapper);
    this.excalidrawRoot.render(createElement(ExcalidrawApp, {
      view: this.editor.view,
      node: this.node,
    }));

    // sync View with current state
    this.updateView();
  }

  // -- Creation ------------------------------------------------------------------
  protected createDomElement(): HTMLElement {
     const dom = createInlineNodeContainer();
           dom.setAttribute(DATA_NODE_TYPE, NodeName.EXCALIDRAW);
    return dom;
  }
}

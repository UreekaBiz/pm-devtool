import { EditorView as CodeMirrorEditorView } from '@codemirror/view';
import { EditorView } from 'prosemirror-view';

import { getPosType, AttributeType, CodeBlockNodeType, NodeName, CODEBLOCK_CODEMIRROR_VIEW_CONTAINER_CLASS, CODEBLOCK_VISUAL_ID_CONTAINER_CLASS, DATA_NODE_TYPE, DATA_VISUAL_ID  } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeView } from 'notebookEditor/model/AbstractNodeView';

import { CodeBlockModel } from './model';
import { CodeBlockStorage } from './storage';

// ********************************************************************************
// == Class =======================================================================
export class CodeBlockView extends AbstractNodeView<CodeBlockNodeType, CodeBlockStorage, CodeBlockModel> {
  /** the div that holds the content plus the visualId container of the CodeBlock */
  public codeMirrorViewContainer: HTMLDivElement;

  /** the CodeMirrorView */
  public codeMirrorView: CodeMirrorEditorView | undefined/*not set yet by Controller*/;

  /** the regular EditorView, also set here for consistency accessing through Controller  */
  public outerView: EditorView;

  /** the div that holds the visualId of the CodeBlock */
  public readonly visualIdContainer: HTMLDivElement;

  // == Lifecycle =================================================================
  public constructor(model: CodeBlockModel, editor: Editor, node: CodeBlockNodeType, storage: CodeBlockStorage, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // -- UI ----------------------------------------------------------------------
    this.outerView = this.editor.view;

    // Create DOM elements and append it to the outer container (dom)
    const codeMirrorViewContainer = document.createElement('div');
    this.codeMirrorViewContainer = codeMirrorViewContainer;
    this.codeMirrorViewContainer.classList.add(CODEBLOCK_CODEMIRROR_VIEW_CONTAINER_CLASS);
    this.dom.appendChild(this.codeMirrorViewContainer);

    this.visualIdContainer = document.createElement('div');
    this.visualIdContainer.contentEditable = 'false';
    this.visualIdContainer.classList.add(CODEBLOCK_VISUAL_ID_CONTAINER_CLASS);
    this.dom.appendChild(this.visualIdContainer);

    // Sync view with current state
    this.updateView();
  }

  // -- Creation ------------------------------------------------------------------
  protected createDomElement() {
    const outerContainer = document.createElement('div');
          outerContainer.setAttribute(DATA_NODE_TYPE, NodeName.CODEBLOCK);
    return outerContainer;
  }

  // -- Update --------------------------------------------------------------------
  public updateView() {
    const { attrs } = this.node;
    const id = attrs[AttributeType.Id];
    if(!id) return/*nothing to do*/;

    // update DOM
    const visualId = this.storage.getVisualId(id);
    this.dom.setAttribute(DATA_VISUAL_ID, visualId);
    this.visualIdContainer.innerHTML = visualId;
  }
}

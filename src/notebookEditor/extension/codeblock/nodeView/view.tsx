import { EditorView as CodeMirrorEditorView } from '@codemirror/view';
import { EditorView } from 'prosemirror-view';

import { createNodeDataAttribute, getCodeBlockFontStyles, getPosType, getWrapStyles, AttributeType, CodeBlockType, CodeBlockNodeType, NodeName, CODEBLOCK_CODEMIRROR_VIEW_CONTAINER_CLASS, CODEBLOCK_VISUAL_ID_CONTAINER_CLASS, DATA_NODE_TYPE, DATA_VISUAL_ID  } from 'common';

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

  /** the container where the content of the CodeBlock is rendered */
  public readonly contentDOM: HTMLDivElement;

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

    // -- ProseMirror -------------------------------------------------------------
    // Tell PM that the content fo the node must go into the paragraph element,
    // by delegating keeping track of the it to PM (SEE: NodeView#contentDOM)
    this.contentDOM = this.codeMirrorViewContainer;

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
    const id = attrs[AttributeType.Id],
          type = attrs[AttributeType.Type] ?? CodeBlockType.Code/*default*/,
          wrap = attrs[AttributeType.Wrap] ?? false/*default*/;
    if(!id) return/*nothing to do*/;
    const visualId = this.storage.getVisualId(id);

    // update DOM
    this.dom.setAttribute(DATA_VISUAL_ID, visualId);
    this.dom.setAttribute(createNodeDataAttribute(AttributeType.Type), type);
    this.dom.style.whiteSpace = getWrapStyles(wrap);

    // update Inner Container
    this.codeMirrorViewContainer.style.fontFamily = getCodeBlockFontStyles(type as CodeBlockType/*by definition*/);

    // update VisualId Container
    this.visualIdContainer.innerHTML = visualId;
  }
}

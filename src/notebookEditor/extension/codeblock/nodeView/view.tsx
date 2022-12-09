import { getPosType, AttributeType, CodeBlockNodeType, NodeName, CODEBLOCK_CONTENT_CONTAINER_CLASS, CODEBLOCK_INNER_CONTAINER_CLASS, CODEBLOCK_LINE_NUMBERS_CONTAINER_CLASS, CODEBLOCK_VISUAL_ID_CONTAINER_CLASS, DATA_NODE_TYPE, DATA_VISUAL_ID  } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeView } from 'notebookEditor/model/AbstractNodeView';

import { CodeBlockModel } from './model';
import { CodeBlockStorage } from './storage';

// ********************************************************************************
// == Class =======================================================================
export class CodeBlockView extends AbstractNodeView<CodeBlockNodeType, CodeBlockStorage, CodeBlockModel> {
  /** the div that holds the content plus the visualId container of the CodeBlock */
  private innerContainer: HTMLDivElement;

  /** the div that holds the line numbers of the CodeBlock */
  public readonly lineNumberContainer: HTMLDivElement;

  /** the div that holds the content of the CodeBlock */
  public readonly contentContainer: HTMLDivElement;

  /** where the content of the CodeBlock is rendered */
  public readonly contentDOM: HTMLDivElement;

  /** the div that holds the visualId of the CodeBlock */
  public readonly visualIdContainer: HTMLDivElement;

  // == Lifecycle =================================================================
  public constructor(model: CodeBlockModel, editor: Editor, node: CodeBlockNodeType, storage: CodeBlockStorage, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // -- UI ----------------------------------------------------------------------
    // Create DOM elements and append it to the outer container (dom)
    this.innerContainer = document.createElement('div');
    this.innerContainer.classList.add(CODEBLOCK_INNER_CONTAINER_CLASS);
    this.dom.appendChild(this.innerContainer);

    this.lineNumberContainer = document.createElement('div');
    this.lineNumberContainer.classList.add(CODEBLOCK_LINE_NUMBERS_CONTAINER_CLASS);
    this.innerContainer.appendChild(this.lineNumberContainer);

    this.contentContainer = document.createElement('div');
    this.contentContainer.classList.add(CODEBLOCK_CONTENT_CONTAINER_CLASS);
    this.innerContainer.appendChild(this.contentContainer);

    this.visualIdContainer = document.createElement('div');
    this.visualIdContainer.contentEditable = 'false';
    this.visualIdContainer.classList.add(CODEBLOCK_VISUAL_ID_CONTAINER_CLASS);
    this.dom.appendChild(this.visualIdContainer);

    // -- ProseMirror -------------------------------------------------------------
    // Tell PM that the content fo the node must go into the paragraph element,
    // by delegating keeping track of the it to PM (SEE: NodeView#contentDOM)
    this.contentDOM = this.contentContainer;

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
    const { attrs } = this.node,
          id = attrs[AttributeType.Id];
    if(!id) return/*nothing to do*/;
    const visualId = this.storage.getVisualId(id);

    // update lineNumberContainer
    this.lineNumberContainer.innerHTML = '';
    for(let i=0; i<this.node.childCount; i++) {
      const lineNum = document.createElement('div');
            lineNum.textContent = i.toString();
      this.lineNumberContainer.appendChild(lineNum);
    }

    // update DOM
    this.dom.setAttribute(DATA_VISUAL_ID, visualId);

    // update visualIdContainer
    this.visualIdContainer.innerHTML = visualId;
  }
}

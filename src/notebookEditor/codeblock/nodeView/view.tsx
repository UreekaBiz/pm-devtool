import { createNodeDataAttribute, getRenderAttributes, getPosType, getWrapStyles, AttributeType, CodeBlockType, CodeBlockNodeRendererSpec, CodeBlockNodeSpec, CodeBlockNodeType, NodeName, CODEBLOCK_INNER_CONTAINER_CLASS, CODEBLOCK_VISUAL_ID_CONTAINER_CLASS, DATA_NODE_TYPE, DATA_VISUAL_ID  } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNodeView } from 'notebookEditor/model/AbstractNodeView';

import { CodeBlockModel } from './model';
import { CodeBlockStorage } from './storage';

// ********************************************************************************
// == Class =======================================================================
export class CodeBlockView extends AbstractNodeView<CodeBlockNodeType, CodeBlockStorage, CodeBlockModel> {
  /** the div that holds the content plus the visualId container of the CodeBlock */
  private innerContainer: HTMLDivElement;

  /** the container where the content of the CodeBlock is rendered */
  public readonly contentDOM: HTMLElement;

  /** the div that holds the visualId of the CodeBlock */
  public readonly visualIdContainer: HTMLDivElement;

  // == Lifecycle =================================================================
  public constructor(model: CodeBlockModel, editor: Editor, node: CodeBlockNodeType, storage: CodeBlockStorage, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // -- UI ----------------------------------------------------------------------
    // Create DOM elements and append it to the outer container (dom)
    const innerContainer = document.createElement('div');
    this.innerContainer = innerContainer;
    this.innerContainer.classList.add(CODEBLOCK_INNER_CONTAINER_CLASS);
    this.dom.appendChild(this.innerContainer);

    this.visualIdContainer = document.createElement('div');
    this.visualIdContainer.contentEditable = 'false';
    this.visualIdContainer.classList.add(CODEBLOCK_VISUAL_ID_CONTAINER_CLASS);
    this.dom.appendChild(this.visualIdContainer);

    // -- ProseMirror -------------------------------------------------------------
    // Tell PM that the content fo the node must go into the paragraph element,
    // by delegating keeping track of the it to PM (SEE: NodeView#contentDOM)
    this.contentDOM = this.innerContainer;

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

    // update styles
    const renderAttributes = getRenderAttributes(NodeName.CODEBLOCK, attrs, CodeBlockNodeRendererSpec, CodeBlockNodeSpec);

    this.dom.setAttribute('style', renderAttributes.style?.toString() ?? ''/*empty string if not defined*/);
    this.dom.style.whiteSpace = getWrapStyles(wrap);

    // update visual id
    if(!id) return/*nothing to do*/;

    const visualId = this.storage.getVisualId(id);
    this.dom.setAttribute(DATA_VISUAL_ID, visualId);
    this.dom.setAttribute(createNodeDataAttribute(AttributeType.Type), type);
    this.visualIdContainer.innerHTML = visualId;
  }
}

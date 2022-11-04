import { computeCodeBlockReferenceText, getPosType, isBlank, AttributeType, CodeBlockReferenceNodeType, NodeName, ACTIONABLE_NODE, DEFAULT_CODEBLOCK_REFERENCE_NODE_TEXT, DATA_NODE_TYPE } from 'common';

import { getCodeBlockViewStorage } from 'notebookEditor/codeblock/nodeView';
import { focusCodeBlock } from 'notebookEditor/codeblock/util';
import { Editor } from 'notebookEditor/editor';
import { createInlineNodeContainer } from 'notebookEditor/extension/util/ui';
import { AbstractNodeView } from 'notebookEditor/model/AbstractNodeView';

import { CodeBlockReferenceStorageType } from './controller';
import { CodeBlockReferenceModel } from './model';

// ********************************************************************************
// == Class =======================================================================
export class CodeBlockReferenceView extends AbstractNodeView<CodeBlockReferenceNodeType, CodeBlockReferenceStorageType, CodeBlockReferenceModel> {
  // -- Attribute -----------------------------------------------------------------
  public viewElement: HTMLElement;

  // -- Lifecycle -----------------------------------------------------------------
  public constructor(model: CodeBlockReferenceModel, editor: Editor, node: CodeBlockReferenceNodeType, storage: CodeBlockReferenceStorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // append View Element to DOM Element
    this.viewElement = this.createViewElement(this.node);
    this.dom.appendChild(this.viewElement);

    // sync view with current state
    this.updateView();

    // setup view functionality
    this.addEventListener();
  }

  // -- Creation ------------------------------------------------------------------
  // creates the DOM Element that will be used to hold the View Element
  protected createDomElement(): HTMLElement {
    const container = createInlineNodeContainer();
          container.setAttribute(DATA_NODE_TYPE, NodeName.CODEBLOCK_REFERENCE);
    return container;
  }

  // creates the DOM Element that will be used to display the Node's Content
  protected createViewElement(node: CodeBlockReferenceNodeType): HTMLElement {
    // gets referenced visual id
    const referencedVisualId = this.getReferencedVisualId();
    const text = computeCodeBlockReferenceText(this.node.attrs, referencedVisualId);

    const viewElement = document.createElement('span');
          viewElement.innerHTML = text;
    return viewElement;
  }

  // -- Update --------------------------------------------------------------------
  public updateView() {
    // update the CodeBlockReference content depending on the ReferencedVisualID
    const referencedVisualId = this.getReferencedVisualId();
    this.viewElement.innerHTML = computeCodeBlockReferenceText(this.node.attrs, referencedVisualId);

    // add special styles on CMD/CTRL pressed, only if reference is not
    // the default reference
    // (SEE: src/common/notebookEditor/attribute.ts) (SEE: Editor.tsx)
    if(!isBlank(this.node.attrs.codeBlockReference)) {
      this.viewElement.setAttribute(ACTIONABLE_NODE, ''/*just add the attribute*/);
    } else {
      this.viewElement.removeAttribute(ACTIONABLE_NODE);
    }
  }

  // -- Destroy -------------------------------------------------------------------
  public destroy() {
    this.viewElement.removeEventListener('mousedown', this.handleViewElementMouseDown);
  }

  // -- Event ---------------------------------------------------------------------
  private addEventListener() {
    this.viewElement.addEventListener('mousedown', this.handleViewElementMouseDown.bind(this/*maintain reference to same scope*/));
  }

  private handleViewElementMouseDown(event: MouseEvent) {
    if(!(event.metaKey || event.ctrlKey)) return/*do not focus referenced CodeBlock if Cmd/Ctrl not pressed*/;

    const { codeBlockReference } = this.node.attrs;
    if(!codeBlockReference) return/*nothing to do*/;

    event.preventDefault()/*do not trigger PM NodeSelection*/;
    const codeBlockViewStorage = getCodeBlockViewStorage(this.editor);
    const codeBlockVisualId = codeBlockViewStorage.getVisualId(codeBlockReference);
    focusCodeBlock(this.editor, codeBlockVisualId);
  }

  // -- Util ----------------------------------------------------------------------
  private getReferencedVisualId() {
    const codeBlockReference = this.node.attrs[AttributeType.CodeBlockReference];
    if(!codeBlockReference) return DEFAULT_CODEBLOCK_REFERENCE_NODE_TEXT/*default*/;

    const codeBlockViewStorage = getCodeBlockViewStorage(this.editor);
    const referencedVisualID = codeBlockViewStorage.getVisualId(codeBlockReference);
    if(!referencedVisualID) return DEFAULT_CODEBLOCK_REFERENCE_NODE_TEXT/*default*/;

    return referencedVisualID;
  }
}

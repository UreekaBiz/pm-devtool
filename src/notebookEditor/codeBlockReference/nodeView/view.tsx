import { getPosType, AttributeType, CodeBlockReferenceNodeType, DEFAULT_CODEBLOCK_REFERENCE_NODE_TEXT } from 'common';

import { getCodeBlockViewStorage } from 'notebookEditor/codeblock/nodeView';
import { Editor } from 'notebookEditor/editor';
import { createInlineNodeContainer } from 'notebookEditor/extension/shared/util';
import { AbstractNodeView } from 'notebookEditor/model/AbstractNodeView';
import { WrapReactNodeView } from 'notebookEditor/model/ReactNodeView';

import { CodeBlockReferenceStorageType } from './controller';
import { CodeBlockReferenceComponent, CodeBlockReferenceComponentProps } from './jsx';
import { CodeBlockReferenceModel } from './model';

// ********************************************************************************
export class CodeBlockReferenceView extends AbstractNodeView<CodeBlockReferenceNodeType, CodeBlockReferenceStorageType, CodeBlockReferenceModel> {
  public constructor(model: CodeBlockReferenceModel, editor: Editor, node: CodeBlockReferenceNodeType, storage: CodeBlockReferenceStorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    this.reactNodeView = (props) => WrapReactNodeView(
      null/*no contentDOM*/,
      props,
      // FIXME: Types!
      (props) => <CodeBlockReferenceComponent {...props as unknown as CodeBlockReferenceComponentProps} />,
      {/*no options*/}
    );

    // Sync view with current state
    this.updateView();
  }

  // -- Creation ------------------------------------------------------------------
  // creates the DOM Element that will be used to hold the View Element
  protected createDomElement(): HTMLElement {
    return createInlineNodeContainer();
  }

  // -- Util ----------------------------------------------------------------------
  public getReferencedVisualId() {
    const codeBlockReference = this.node.attrs[AttributeType.CodeBlockReference];
    if(!codeBlockReference) return DEFAULT_CODEBLOCK_REFERENCE_NODE_TEXT/*default*/;

    const codeBlockViewStorage = getCodeBlockViewStorage(this.editor);
    const referencedVisualID = codeBlockViewStorage.getVisualId(codeBlockReference);
    if(!referencedVisualID) return DEFAULT_CODEBLOCK_REFERENCE_NODE_TEXT/*default*/;

    return referencedVisualID;
  }
}

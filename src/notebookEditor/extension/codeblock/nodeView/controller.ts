import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorView as CodeMirrorEditorView } from '@codemirror/view';

import { getPosType, AttributeType, CodeBlockNodeType, CodeBlockLanguage } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeController } from 'notebookEditor/model/AbstractNodeController';

import { CodeBlockModel } from './model';
import { CodeBlockStorage } from './storage';
import { computeChangedTextRange, syncSelections, setCodeBlockLanguage, accountForCodeBlockValueChange, createCodeMirrorViewState } from './util';
import { CodeBlockView } from './view';

// ********************************************************************************
export class CodeBlockController extends AbstractNodeController<CodeBlockNodeType, CodeBlockStorage, CodeBlockModel, CodeBlockView> {
  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: CodeBlockNodeType, codeBlockStorage: CodeBlockStorage, getPos: getPosType) {
    const model = new CodeBlockModel(editor, node, codeBlockStorage, getPos),
          view = new CodeBlockView(model, editor, node, codeBlockStorage, getPos);

    super(model, view, editor, node, codeBlockStorage, getPos);
    this.setupCodeMirrorView();
  }

  private setupCodeMirrorView() {
    const codeMirrorView = new CodeMirrorEditorView({
      state: createCodeMirrorViewState(this.nodeView.outerView, this.getPos, this.node.textContent, this.nodeModel.languageCompartment),
      dispatch: (tr) => {
        codeMirrorView.update([tr]);
        
        if(!this.nodeModel.isUpdating) {
          const textUpdate = tr.state.toJSON().doc;
          accountForCodeBlockValueChange(this.nodeView.outerView, this.node, this.getPos, textUpdate);

          if(codeMirrorView.hasFocus) {
            syncSelections(codeMirrorView, this.nodeView.outerView, this.getPos);
          } /* else -- codeMirrorView has no focus, do not sync Selection*/
        } /* else -- updating */

      },
    });

    this.nodeView.codeMirrorView = codeMirrorView;
    this.nodeView.codeMirrorViewContainer.append(codeMirrorView.dom);
    setCodeBlockLanguage(codeMirrorView, this.nodeModel.languageCompartment, this.node.attrs[AttributeType.Language] ?? CodeBlockLanguage.JavaScript/*default*/);
  }

  // == ProseMirror ===============================================================
  public update(node: ProseMirrorNode) {
    // NOTE: these checks must be done before the super call, since otherwise
    //       the compartments of the CodeMirrorView will not be updated, as
    //       the received Node will then be this.node
    if(!this.nodeView.codeMirrorView) return false/*no View to update*/;
    const updatedNodeLanguage = node.attrs[AttributeType.Language];
    if(updatedNodeLanguage/*not undefined*/ && updatedNodeLanguage !== this.node.attrs[AttributeType.Language]) {
      setCodeBlockLanguage(this.nodeView.codeMirrorView, this.nodeModel.languageCompartment, node.attrs[AttributeType.Language]);
    } /* else -- language did not change */

    const superUpdate = super.update(node);
    if(!superUpdate) return false/*did not receive the right type of Node*/;

    const currentCodeBlockText = this.nodeView.codeMirrorView.state.doc.toString(),
          newCodeBlockText = node.textContent;
    const changedTextRange = computeChangedTextRange(currentCodeBlockText, newCodeBlockText);
    if(changedTextRange) {
      try {
        this.nodeModel.isUpdating = true/*start update*/;
        this.nodeView.codeMirrorView.dispatch({
          changes: { from: changedTextRange.from, to: changedTextRange.to, insert: changedTextRange.text },
          selection: { anchor: changedTextRange.from + changedTextRange.text.length },
        });
      } finally {
        this.nodeModel.isUpdating = false/*end update*/;
      }
    } /* else -- no changes to account for */

    return true/*updated*/;
  }

  // .. Selection .................................................................
  // REF: https://prosemirror.net/examples/codemirror/ #selectNode
  /** focus the CodeMirrorView when the CodeBlock is selected */
  public selectNode() {
    if(!this.nodeView.codeMirrorView) return/*not set yet, nothing to do*/;
    this.nodeView.codeMirrorView?.focus();
  }

  // REF: https://prosemirror.net/examples/codemirror/ #setSelection
  /** set the selection inside the CodeMirrorView */
  public setSelection(anchor: number, head: number)  {
    if(!this.nodeView.codeMirrorView) return/*not set yet, nothing to do*/;

    try {
      this.nodeModel.isUpdating = true/*update started*/;
      this.nodeView.codeMirrorView.dispatch({ selection: { anchor, head } });
      this.nodeView.codeMirrorView.focus();
      syncSelections(this.nodeView.codeMirrorView, this.nodeView.outerView, this.getPos);
    } finally {
      this.nodeModel.isUpdating = false/*update finished*/;
    }
  }

  // .. Event .....................................................................
  // REF: https://prosemirror.net/examples/codemirror/ #stopEvent
  /**
   * prevent the outer EditorView from trying to handle DOM events
   * that bubble up from the CodeMirrorView
   */
  public stopEvent(event: Event) {
    return true/*outer EditorView will not handle the event*/;
  }

  // .. Mutation ..................................................................
  /** ignore all Mutations, since they should be handled by CodeMirror */
  public ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Element; }) {
    return true/*ignore all mutations*/;
  }
}

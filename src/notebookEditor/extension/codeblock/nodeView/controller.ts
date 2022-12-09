import { getPosType, CodeBlockNodeType, AttributeType, DATA_VISUAL_ID, DATA_ATTRIBUTE } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeController } from 'notebookEditor/model/AbstractNodeController';

import { CodeBlockModel } from './model';
import { CodeBlockStorage } from './storage';
import { CodeBlockView } from './view';

// ********************************************************************************
export class CodeBlockController extends AbstractNodeController<CodeBlockNodeType, CodeBlockStorage, CodeBlockModel, CodeBlockView> {
  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: CodeBlockNodeType, codeBlockStorage: CodeBlockStorage, getPos: getPosType) {
    const model = new CodeBlockModel(editor, node, codeBlockStorage, getPos),
          view = new CodeBlockView(model, editor, node, codeBlockStorage, getPos);

    super(model, view, editor, node, codeBlockStorage, getPos);
  }

  // .. Mutation ..................................................................
  /**
   * ensure CodeBlock NodeViews do not get destroyed incorrectly either
   * logically (in the Storage) or the View
   */
   // NOTE: these checks are as specific as possible to avoid messing with the
   //       default ProseMirror lifecycle
   public ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Element; }) {
    // REF: https://discuss.prosemirror.net/t/what-can-cause-a-nodeview-to-be-rebuilt/4959
    // NOTE: this specifically addresses the CodeBlock NodeViews being removed
    //       after destroy() gets called when the DOM mutation happens inside
    //       the DOM when adding or removing Headings, which change the VisualId
    //       of the CodeBlock and hence trigger the mutation.
    //       Currently this logic is exclusive to CodeBlocks since their VisualId gets
    //       updated dynamically
    if(this.nodeView.dom?.contains(mutation.target)) {
      const id = this.node.attrs[AttributeType.Id];
      if(!id) return false/*do not ignore mutation*/;

      const visualId = this.nodeView.storage.getVisualId(this.node.attrs.id ?? '');
      if(visualId === mutation.target.textContent?.trim()) {
        return true/*ignore mutation*/;
      } /* else -- the mutation target has no textContent or it does not equal the visualId */
    } /* else -- the nodeView has no DOM or the mutation did not happen inside of it */

    // if there was an attribute mutation and it includes the visualId, then ignore the mutation
    // or an attribute of the CodeBlock changed, ignore it
    if(mutation.type === 'attributes' && (mutation.attributeName === DATA_VISUAL_ID || mutation.attributeName?.includes(DATA_ATTRIBUTE))) {
      return true/*(SEE: comment above)*/;
    } /* else -- the mutation was not of attribute type, it did not change the visualId, or it did not update an attribute */

    // if there was a childList mutation and the target is the visualId container, ignore it
    if(mutation.type === 'childList' && mutation.target === this.nodeView.visualIdContainer) {
      return true/*(SEE: comment above)*/;
    } /* else -- mutation is not of childList type or the target was not the visualId container */

    return false/*do not ignore */;
  }
}

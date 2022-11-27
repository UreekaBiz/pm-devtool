import { Command, EditorState, Transaction } from 'prosemirror-state';

import { createCodeBlockReferenceNode, generateNodeId, getSelectedNode, isCodeBlockReferenceNode, AbstractDocumentUpdate, CodeBlockReferenceAttributes, ReplaceAndSelectNodeDocumentUpdate } from 'common';

import { focusChipToolInput } from 'notebookEditor/extension/shared/component/chipTool/util';

// ================================================================================
/** insert and select a CodeBlockReference */
export const insertAndSelectCodeBlockReferenceCommand: Command = (state, dispatch) => {
  const id = generateNodeId();

  const result = AbstractDocumentUpdate.execute(new InsertAndSelectCodeBlockReferenceDocumentUpdate({ id }), state, dispatch);
  if(result) {
    focusChipToolInput(id);
    return result;
  } /* else -- could not execute DocumentUpdate */

  return false/*not executed*/;
};
export class InsertAndSelectCodeBlockReferenceDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly attributes: Partial<CodeBlockReferenceAttributes>) {/*nothing additional*/}

  /*
   * modify the given Transaction such that a CodeBlockReference is inserted
   * and selected, then return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const node = getSelectedNode(editorState);
    if(node && isCodeBlockReferenceNode(node)) return tr/*no updates, ignore if selected Node already is a CodeBlockReference*/;

    const codeBlockReference = createCodeBlockReferenceNode(editorState.schema, { ...this.attributes } );

    const updatedTr = new ReplaceAndSelectNodeDocumentUpdate(codeBlockReference).update(editorState, editorState.tr);
    return updatedTr/*updated*/;
  }
}

import { Command, EditorState, Transaction } from 'prosemirror-state';

import { createExcalidrawNode, generateNodeId, getSelectedNode, isExcalidrawNode, AbstractDocumentUpdate, ExcalidrawAttributes, ReplaceAndSelectNodeDocumentUpdate } from 'common';

// ********************************************************************************
export const insertAndSelectExcalidrawCommand: Command = (state, dispatch) => {
  const id = generateNodeId();
  const result = AbstractDocumentUpdate.execute(new InsertAndSelectExcalidrawDocumentUpdate({ id }), state, dispatch);
  if(result) {
    return result;
  } /* else -- could not execute DocumentUpdate */

  return false/*not executed*/;
};
export class InsertAndSelectExcalidrawDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly attributes: Partial<ExcalidrawAttributes>) {/*nothing additional*/}

  /*
   * modify the given Transaction such that a DemoAsyncNode is inserted
   * and selected, then return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const node = getSelectedNode(editorState);
    if(node && isExcalidrawNode(node)) return tr/*no updates, ignore if selected Node already is a DemoAsyncNode*/;

    const excalidraw = createExcalidrawNode(editorState.schema, { ...this.attributes } );

    const updatedTr = new ReplaceAndSelectNodeDocumentUpdate(excalidraw).update(editorState, editorState.tr);
    return updatedTr/*updated*/;
  }
}

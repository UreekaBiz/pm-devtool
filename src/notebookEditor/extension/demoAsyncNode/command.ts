import { Command, EditorState, Transaction } from 'prosemirror-state';

import { createDemoAsyncNodeNode, generateNodeId, getSelectedNode, isDemoAsyncNode, AbstractDocumentUpdate, DemoAsyncNodeAttributes, ReplaceAndSelectNodeDocumentUpdate } from 'common';

import { focusChipToolInput } from '../shared/component/chipTool/util';

// ********************************************************************************
/** insert and select a DemoAsyncNode */
export const insertAndSelectDemoAsyncNodeCommand: Command = (state, dispatch) => {
  const id = generateNodeId();
  const result = AbstractDocumentUpdate.execute(new InsertAndSelectDemoAsyncNodeDocumentUpdate({ id }), state, dispatch);
  if(result) {
    focusChipToolInput(id);
    return result;
  } /* else -- could not execute DocumentUpdate */

  return false/*not executed*/;
};
export class InsertAndSelectDemoAsyncNodeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly attributes: Partial<DemoAsyncNodeAttributes>) {/*nothing additional*/}

  /*
   * modify the given Transaction such that a DemoAsyncNode is inserted
   * and selected, then return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const node = getSelectedNode(editorState);
    if(node && isDemoAsyncNode(node)) return tr/*no updates, ignore if selected Node already is a DemoAsyncNode*/;

    const demoAsyncNode = createDemoAsyncNodeNode(editorState.schema, { ...this.attributes } );

    const updatedTr = new ReplaceAndSelectNodeDocumentUpdate(demoAsyncNode).update(editorState, editorState.tr);
    return updatedTr/*updated*/;
  }
}

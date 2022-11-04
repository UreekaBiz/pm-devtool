import { computeState, NodeIdentifier, NodeName, VisualId, VisualIdMap } from 'common';

import { Editor } from 'notebookEditor/editor';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { CodeBlockController } from './controller';

// ********************************************************************************
// == Storage =====================================================================
export class CodeBlockStorage extends NodeViewStorage<CodeBlockController> {
  // The visualId indicates the position of the CodeBlock relative to Headings and
  // other CodeBlocks that are present in the Editor, and its displayed to the
  // right of the content container in the CodeBlockController.
  private visualIdMap: VisualIdMap;

  // -- Life-cycle ----------------------------------------------------------------
  constructor() {
    super();

    this.visualIdMap = {/*empty map by contract*/};
  }

  // -- Visual Ids ----------------------------------------------------------------
  public updateVisualIds(editor: Editor) {
    const codeBlockState = computeState(editor.view.state.doc.toJSON())[NodeName.CODEBLOCK];
    this.visualIdMap = codeBlockState.visualIds;
  }

  public getVisualId(id: NodeIdentifier): VisualId {
    return this.visualIdMap[id];
  }

  public getCodeBlockId(searchedVisualId: VisualId): NodeIdentifier | undefined {
    return Object.keys(this.visualIdMap).find(codeBlockId => this.visualIdMap[codeBlockId] === searchedVisualId);
  }
}
export const getCodeBlockViewStorage = (editor: Editor): CodeBlockStorage => {
  const storage = editor.storage.get(NodeName.CODEBLOCK);
  if(!isCodeBlockViewStorage(storage)) throw new Error('Wrong type of storage for CodeBlock');
  return storage;
};
const isCodeBlockViewStorage = (storage: any): storage is CodeBlockStorage => 'visualIdMap' in storage;

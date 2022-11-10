import { getPosType, TableNodeType } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNodeController } from 'notebookEditor/model/AbstractNodeController';
import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { updateTableColumns } from '../util';
import { TableModel } from './model';
import { TableView } from './view';

// ********************************************************************************
export type TableStorageType = NodeViewStorage<TableController>;
export class TableController extends AbstractNodeController<TableNodeType, TableStorageType, TableModel, TableView> {
  // == Life-cycle ================================================================
  public constructor(editor: Editor, node: TableNodeType, storage: TableStorageType, getPos: getPosType) {
    const model = new TableModel(editor, node, storage, getPos),
          view = new TableView(model, editor, node, storage, getPos);

    super(model, view, editor, node, storage, getPos);
  }

  // .. Update ....................................................................
  public update(node: TableNodeType) {
    const result = super.update(node);
    if(!result) return result;

    updateTableColumns(node, this.nodeView.columnGroup, this.nodeView.table, this.nodeView.minimumCellWidth);
    return result;
  }

  // .. Mutation ..................................................................
  /**
   * ignore Mutations that change the attributes of the Table when the mutation
   * happens inside it or its columnGroup
   */
   public ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Element; }) {
    return (mutation.type === 'attributes' && (mutation.target === this.nodeView.table || (this.nodeView.columnGroup.contains(mutation.target))));
  }
}

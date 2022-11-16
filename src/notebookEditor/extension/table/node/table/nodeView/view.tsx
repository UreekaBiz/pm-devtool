import { DATA_NODE_TYPE, getPosType, MIN_CELL_WIDTH, NodeName, TableNodeType, TABLE_CONTAINER_CLASS } from 'common';

import { Editor } from 'notebookEditor/editor';
import { AbstractNodeView } from 'notebookEditor/model/AbstractNodeView';
import { updateTableColumns } from '../util';

import { TableStorageType } from './controller';
import { TableModel } from './model';

// ********************************************************************************
// == Class =======================================================================
export class TableView extends AbstractNodeView<TableNodeType, TableStorageType, TableModel> {
  // -- Attribute -----------------------------------------------------------------
  /** the {@link HTMLTableElement} that holds the Table */
  public table: HTMLTableElement;

  /** the {@link HTMLColgroup} that holds the Table */
  public columnGroup: HTMLTableColElement;

  /** the minimum width of the Cells inside this Table */
  public minimumCellWidth: number;

  // -- Lifecycle -----------------------------------------------------------------
  public constructor(model: TableModel, editor: Editor, node: TableNodeType, storage: TableStorageType, getPos: getPosType) {
    super(model, editor, node, storage, getPos);

    // .. UI ......................................................................
    this.minimumCellWidth = MIN_CELL_WIDTH;

    this.table = document.createElement('table');
    this.table.setAttribute(DATA_NODE_TYPE, NodeName.TABLE);
    this.dom.appendChild(this.table);

    this.columnGroup = document.createElement('colgroup');
    this.table.appendChild(this.columnGroup);

    updateTableColumns(node, this.columnGroup, this.table, this.minimumCellWidth);

    // .. PM ......................................................................
    this.contentDOM = document.createElement('tbody');
    this.contentDOM = this.table.appendChild(this.contentDOM);
  }

  // -- Creation ------------------------------------------------------------------
  protected createDomElement(): HTMLElement {
    const dom = document.createElement('div');
          dom.classList.add(TABLE_CONTAINER_CLASS);
    return dom;
  }
}

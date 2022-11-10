import { getPosType, MIN_CELL_WIDTH, TableNodeType, TABLE_CONTAINER_CLASS } from 'common';

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
    this.table = document.createElement('table');
    this.dom.appendChild(this.table);

    this.columnGroup = document.createElement('colgroup');
    this.table.appendChild(this.columnGroup);

    const tableBody = document.createElement('tbody');
    this.table.appendChild(tableBody);

    this.minimumCellWidth = MIN_CELL_WIDTH;

    // .. PM ......................................................................
    this.contentDOM = this.table;

    // ............................................................................
    updateTableColumns(this.node, this.columnGroup, this.table, this.minimumCellWidth);
  }

  // -- Creation ------------------------------------------------------------------
  protected createDomElement(): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add(TABLE_CONTAINER_CLASS);
    return dom;
  }
}

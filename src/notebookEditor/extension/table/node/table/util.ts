import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';

import { getTableNodeTypes, AttributeType, NotebookSchemaType, TableNodeType, NodeName } from 'common';

import { isValidHTMLElement } from 'notebookEditor/extension/util';

import { createCell } from '../cell/util';

// ********************************************************************************
// == Create ======================================================================
export const createTable = (schema: NotebookSchemaType, rowsCount: number, colsCount: number, withHeaderRow: boolean, cellContent?: Fragment | ProseMirrorNode | Array<ProseMirrorNode>): ProseMirrorNode => {
  const types = getTableNodeTypes(schema);
  const headerCells = [];
  const cells = [];

  for(let index = 0; index < colsCount; index += 1) {
    const cellType = types[NodeName.CELL];
    const headerType = types[NodeName.HEADER_CELL];
    if(!cellType || !headerType) throw new Error('Cell or Header type not defined defined. Check that the correct names are being used');

    const cell = createCell(cellType, cellContent);
    if(!cell) throw new Error('Cell not created successfully when it was meant to');
    cells.push(cell);

    if(withHeaderRow) {
      const headerCell = createCell(headerType, cellContent);
      if(!headerCell) throw new Error('Header cell not created successfully when it was meant to.');

      headerCells.push(headerCell);
    } /* else -- do not add header row */
  }

  const rows = [];
  for(let index = 0; index < rowsCount; index += 1) {
    rows.push(types.row.createChecked(null/*no attrs*/, withHeaderRow && index === 0 ? headerCells : cells));
  }

  return types.table.createChecked(null/*no attrs*/, rows);
};

// == Update ======================================================================
/** update the Columns of a Table */
export const updateTableColumns = (node: TableNodeType, columnGroup: HTMLTableColElement, table: HTMLTableElement, minimumCellWidth: number, overrideCol?: number, overrideValue?: number) => {
  let totalWidth = 0/*default*/;
  let fixedWidth = true/*default*/;

  let nextDOM = columnGroup.firstChild;
  if(!isValidHTMLElement(nextDOM)) return/*nothing to do*/;

  const row = node.firstChild;
  if(!row) return/*nothing to do*/;

  for(let i = 0, col = 0; i < row.childCount; i++) {
    const colSpan = row.child(i).attrs[AttributeType.ColSpan];
    const colWidth = row.child(i).attrs[AttributeType.ColWidth];
    for(let j = 0; j < colSpan; j++, col++) {
      const hasWidth = overrideCol === col ? overrideValue : colWidth && colWidth[j];

      const cssWidth = hasWidth ? hasWidth + 'px' : '';
      totalWidth += hasWidth || minimumCellWidth;
      if(!hasWidth) {
        fixedWidth = false;
      } /* else -- do not change default */

      if(!nextDOM) {
        const newColumn = document.createElement('col');
        columnGroup.appendChild(newColumn).style.width = cssWidth;
      } else {
        if(isValidHTMLElement(nextDOM) && nextDOM.style.width !== cssWidth) {
          nextDOM.style.width = cssWidth;
        } /* else -- no need to change width */

        nextDOM = nextDOM.nextSibling;
      }
    }
  }

  while(nextDOM) {
    const after = nextDOM.nextSibling;
    nextDOM.parentNode?.removeChild(nextDOM);
    nextDOM = after;
  }

  if(fixedWidth) {
    table.style.width = totalWidth + 'px';
    table.style.minWidth = '';
  } else {
    table.style.width = '';
    table.style.minWidth = totalWidth + 'px';
  }
};


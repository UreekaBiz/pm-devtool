import { AttributeType, TableNodeType } from 'common';

import { isValidHTMLElement } from 'notebookEditor/extension/util';

// ********************************************************************************
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

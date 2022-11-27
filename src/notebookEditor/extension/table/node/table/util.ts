import { AttributeType, TableNodeType } from 'common';

import { isValidHTMLElement } from 'notebookEditor/extension/util';
import { Unit } from 'notebookEditor/theme';

// ********************************************************************************
// == Update ======================================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/tableview.js

/** update the Columns of a Table */
export const updateTableColumns = (node: TableNodeType, columnGroup: HTMLTableColElement, tableDOM: HTMLTableElement, minimumCellWidth: number, overrideCol?: number, overrideValue?: number) => {
  let totalWidth = 0/*default*/,
      fixedWidth = true/*default*/;

  let nextDOMNode = columnGroup.firstChild/**default*/;

  const row = node.firstChild;
  if(!row) return/*nothing to do*/;

  for(let i = 0, col = 0; i < row.childCount; i++) {
    const colSpan = row.child(i).attrs[AttributeType.ColSpan],
          colWidth = row.child(i).attrs[AttributeType.ColWidth];

    for(let j = 0; j < colSpan; j++, col++) {
      const hasWidth = overrideCol === col ? overrideValue : colWidth && colWidth[j],
            cssWidth = hasWidth ? hasWidth + Unit.Pixel : ''/*none*/;

      totalWidth += hasWidth || minimumCellWidth;
      if(!hasWidth) {
        fixedWidth = false;
      } /* else -- do not change default */

      if(!nextDOMNode) {
        const newColumn = document.createElement('col');
        columnGroup.appendChild(newColumn).style.width = cssWidth;
      } else {
        if(isValidHTMLElement(nextDOMNode) && nextDOMNode.style.width !== cssWidth) {
          nextDOMNode.style.width = cssWidth;
        } /* else -- no need to change width */

        nextDOMNode = nextDOMNode.nextSibling;
      }
    }
  }

  while(nextDOMNode) {
    const after = nextDOMNode.nextSibling;
    nextDOMNode.parentNode?.removeChild(nextDOMNode);
    nextDOMNode = after;
  }

  if(fixedWidth) {
    tableDOM.style.width = totalWidth + Unit.Pixel;
    tableDOM.style.minWidth = ''/*none*/;
  } else {
    tableDOM.style.width = ''/*none*/;
    tableDOM.style.minWidth = totalWidth + Unit.Pixel;
  }
};

import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';

import { AttributeType } from '../../../../notebookEditor/attribute';
import { generateNodeId, NodeName } from '../../../../notebookEditor/node';
import { NotebookSchemaType } from '../../../../notebookEditor/schema';
import { getTableNodeTypes } from '../../../extension/table/node/table';

import { createCell } from '../cell/util';

// == Create ======================================================================
export const createTable = (schema: NotebookSchemaType, rowsCount: number, colsCount: number, withHeaderRow: boolean, cellContent?: Fragment | ProseMirrorNode | Array<ProseMirrorNode>): ProseMirrorNode => {
  const types = getTableNodeTypes(schema);
  const headerCells: ProseMirrorNode[] = [];
  const cells: ProseMirrorNode[] = [];

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

  return types.table.createChecked({ [AttributeType.Id]: generateNodeId() }, rows);
};


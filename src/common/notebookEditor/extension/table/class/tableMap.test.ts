import ist from 'ist';

import { getNotebookSchemaNodeBuilders } from '../../../../notebookEditor/command/test/testUtil';
import { cellBuilder, cellWithDimensionBuilder } from '../../../../notebookEditor/command/test/tableTestUtil';
import { NodeName } from '../../../../notebookEditor/node';

import { TableMap } from './TableMap';
import { TableRect } from './TableRect';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.ROW]: rowBuilder,
  [NodeName.TABLE]: tableBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.ROW, NodeName.TABLE]);
const areRectsEqual = (a: TableRect, b: TableRect) => (a.left === b.left && a.right === b.right && a.top === b.top && a.bottom === b.bottom);

// == Test ========================================================================
describe('TableMap', () => {
  it('finds the right shape for a simple table', () => {
    ist(
      TableMap.get(
        tableBuilder(
          rowBuilder(cellBuilder, cellBuilder, cellBuilder),
          rowBuilder(cellBuilder, cellBuilder, cellBuilder),
          rowBuilder(cellBuilder, cellBuilder, cellBuilder),
          rowBuilder(cellBuilder, cellBuilder, cellBuilder)
        )
      ).map.join(', '),

      '1, 6, 11, 18, 23, 28, 35, 40, 45, 52, 57, 62'
    );
  });

  it('finds the right shape for colSpans', () => {
    ist(TableMap.get(tableBuilder(rowBuilder(cellBuilder, cellWithDimensionBuilder(2, 1)), rowBuilder(cellWithDimensionBuilder(2, 1), cellBuilder), rowBuilder(cellBuilder, cellBuilder, cellBuilder)))
      .map.join(', '),

      '1, 6, 6, 13, 13, 18, 25, 30, 35'
    );
  });

  it('finds the right shape for rowSpans', () => {
    ist(TableMap.get(tableBuilder(rowBuilder(cellWithDimensionBuilder(1, 2), cellBuilder, cellWithDimensionBuilder(1, 2)), rowBuilder(cellBuilder)))
      .map.join(', '),

      '1, 6, 11, 1, 18, 11'
    );
  });

  it('finds the right shape for deep rowSpans', () => {
    ist(TableMap.get(tableBuilder(rowBuilder(cellWithDimensionBuilder(1, 4), cellWithDimensionBuilder(2, 1)), rowBuilder(cellWithDimensionBuilder(1, 2), cellWithDimensionBuilder(1, 2)), rowBuilder()))
      .map.join(', '),

      '1, 6, 6, 1, 13, 18, 1, 13, 18'
    );
  });

  it('finds the right shape for larger rectangles', () => {
    ist(TableMap.get(tableBuilder(rowBuilder(cellBuilder, cellWithDimensionBuilder(4, 4)), rowBuilder(cellBuilder), rowBuilder(cellBuilder), rowBuilder(cellBuilder)))
      .map.join(', '),

      '1, 6, 6, 6, 6, 13, 6, 6, 6, 6, 20, 6, 6, 6, 6, 27, 6, 6, 6, 6'
    );
  });

  const tableMap = TableMap.get(tableBuilder(rowBuilder(cellWithDimensionBuilder(2, 3), cellBuilder, cellWithDimensionBuilder(1, 2)), rowBuilder(cellBuilder), rowBuilder(cellWithDimensionBuilder(2, 1))));
  // expected to be:
  //  1  1  6 11
  //  1  1 18 11
  //  1  1 25 25

  it('can accurately find cell sizes', () => {
    ist(tableMap.width, 4);
    ist(tableMap.height, 3);
    ist(tableMap.findCell(1), { left: 0, right: 2, top: 0, bottom: 3 }, areRectsEqual);
    ist(tableMap.findCell(6), { left: 2, right: 3, top: 0, bottom: 1 }, areRectsEqual);
    ist(tableMap.findCell(11), { left: 3, right: 4, top: 0, bottom: 2 }, areRectsEqual);
    ist(tableMap.findCell(18), { left: 2, right: 3, top: 1, bottom: 2 }, areRectsEqual);
    ist(tableMap.findCell(25), { left: 2, right: 4, top: 2, bottom: 3 }, areRectsEqual);
  });

  it('can find the rectangle between two cells', () => {
    ist(tableMap.cellsInRect(tableMap.rectBetween(1, 6)).join(', '), '1, 6, 18, 25');
    ist(tableMap.cellsInRect(tableMap.rectBetween(1, 25)).join(', '), '1, 6, 11, 18, 25');
    ist(tableMap.cellsInRect(tableMap.rectBetween(1, 1)).join(', '), '1');
    ist(tableMap.cellsInRect(tableMap.rectBetween(6, 25)).join(', '), '6, 11, 18, 25');
    ist(tableMap.cellsInRect(tableMap.rectBetween(6, 11)).join(', '), '6, 11, 18');
    ist(tableMap.cellsInRect(tableMap.rectBetween(11, 6)).join(', '), '6, 11, 18');
    ist(tableMap.cellsInRect(tableMap.rectBetween(18, 25)).join(', '), '18, 25');
    ist(tableMap.cellsInRect(tableMap.rectBetween(6, 18)).join(', '), '6, 18');
  });

  it('can find adjacent cells', () => {
    ist(tableMap.nextCell(1, 'horizontal', 1), 6);
    ist(tableMap.nextCell(1, 'horizontal', -1), null/*no direction specified*/);
    ist(tableMap.nextCell(1, 'vertical', 1), null/*no direction specified*/);
    ist(tableMap.nextCell(1, 'vertical', -1), null/*no direction specified*/);

    ist(tableMap.nextCell(18, 'horizontal', 1), 11);
    ist(tableMap.nextCell(18, 'horizontal', -1), 1);
    ist(tableMap.nextCell(18, 'vertical', 1), 25);
    ist(tableMap.nextCell(18, 'vertical', -1), 6);

    ist(tableMap.nextCell(25, 'vertical', 1), null/*no direction specified*/);
    ist(tableMap.nextCell(25, 'vertical', -1), 18);
    ist(tableMap.nextCell(25, 'horizontal', 1), null/*no direction specified*/);
    ist(tableMap.nextCell(25, 'horizontal', -1), 1);
  });
});

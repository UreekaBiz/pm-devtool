import ist from 'ist';

import { defaultCell, cellWDimension, row, table } from '../../../../notebookEditor/command/test/tableTestUtil';

import { TableMap } from './TableMap';
import { TableRect } from './TableRect';

// ********************************************************************************
// == Constant ====================================================================
const areRectsEqual = (a: TableRect, b: TableRect) => (a.left === b.left && a.right === b.right && a.top === b.top && a.bottom === b.bottom);

// == Test ========================================================================
// NOTE: these are inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/test/test-tablemap.js

describe('TableMap', () => {
  it('finds the right shape for a simple table', () => {
    ist(
      TableMap.getTableMap(
        table(row(defaultCell, defaultCell, defaultCell),
              row(defaultCell, defaultCell, defaultCell),
              row(defaultCell, defaultCell, defaultCell),
              row(defaultCell, defaultCell, defaultCell)
        )
      ).map.join(', '),

      '1, 6, 11, 18, 23, 28, 35, 40, 45, 52, 57, 62'
    );
  });

  it('finds the right shape for colSpans', () => {
    ist(TableMap.getTableMap(table(row(defaultCell, cellWDimension(2, 1)), row(cellWDimension(2, 1), defaultCell), row(defaultCell, defaultCell, defaultCell)))
      .map.join(', '),

      '1, 6, 6, 13, 13, 18, 25, 30, 35'
    );
  });

  it('finds the right shape for rowSpans', () => {
    ist(TableMap.getTableMap(table(row(cellWDimension(1, 2), defaultCell, cellWDimension(1, 2)), row(defaultCell)))
      .map.join(', '),

      '1, 6, 11, 1, 18, 11'
    );
  });

  it('finds the right shape for deep rowSpans', () => {
    ist(TableMap.getTableMap(table(row(cellWDimension(1, 4), cellWDimension(2, 1)), row(cellWDimension(1, 2), cellWDimension(1, 2)), row()))
      .map.join(', '),

      '1, 6, 6, 1, 13, 18, 1, 13, 18'
    );
  });

  it('finds the right shape for larger rectangles', () => {
    ist(TableMap.getTableMap(table(row(defaultCell, cellWDimension(4, 4)), row(defaultCell), row(defaultCell), row(defaultCell)))
      .map.join(', '),

      '1, 6, 6, 6, 6, 13, 6, 6, 6, 6, 20, 6, 6, 6, 6, 27, 6, 6, 6, 6'
    );
  });

  const tableMap = TableMap.getTableMap(table(row(cellWDimension(2, 3), defaultCell, cellWDimension(1, 2)), row(defaultCell), row(cellWDimension(2, 1))));
  // expected to be:
  //  1  1  6 11
  //  1  1 18 11
  //  1  1 25 25

  it('can accurately find cell sizes', () => {
    ist(tableMap.width, 4);
    ist(tableMap.height, 3);
    ist(tableMap.getCellTableRect(1), { left: 0, right: 2, top: 0, bottom: 3 }, areRectsEqual);
    ist(tableMap.getCellTableRect(6), { left: 2, right: 3, top: 0, bottom: 1 }, areRectsEqual);
    ist(tableMap.getCellTableRect(11), { left: 3, right: 4, top: 0, bottom: 2 }, areRectsEqual);
    ist(tableMap.getCellTableRect(18), { left: 2, right: 3, top: 1, bottom: 2 }, areRectsEqual);
    ist(tableMap.getCellTableRect(25), { left: 2, right: 4, top: 2, bottom: 3 }, areRectsEqual);
  });

  it('can find the rectangle between two cells', () => {
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(1, 6)).join(', '), '1, 6, 18, 25');
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(1, 25)).join(', '), '1, 6, 11, 18, 25');
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(1, 1)).join(', '), '1');
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(6, 25)).join(', '), '6, 11, 18, 25');
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(6, 11)).join(', '), '6, 11, 18');
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(11, 6)).join(', '), '6, 11, 18');
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(18, 25)).join(', '), '18, 25');
    ist(tableMap.getCellsInTableRect(tableMap.getTableRectBetweenCellPositions(6, 18)).join(', '), '6, 18');
  });

  it('can find adjacent cells', () => {
    ist(tableMap.getNextCellPos(1, 'horizontal', 1), 6);
    ist(tableMap.getNextCellPos(1, 'horizontal', -1), null/*no direction specified*/);
    ist(tableMap.getNextCellPos(1, 'vertical', 1), null/*no direction specified*/);
    ist(tableMap.getNextCellPos(1, 'vertical', -1), null/*no direction specified*/);

    ist(tableMap.getNextCellPos(18, 'horizontal', 1), 11);
    ist(tableMap.getNextCellPos(18, 'horizontal', -1), 1);
    ist(tableMap.getNextCellPos(18, 'vertical', 1), 25);
    ist(tableMap.getNextCellPos(18, 'vertical', -1), 6);

    ist(tableMap.getNextCellPos(25, 'vertical', 1), null/*no direction specified*/);
    ist(tableMap.getNextCellPos(25, 'vertical', -1), 18);
    ist(tableMap.getNextCellPos(25, 'horizontal', 1), null/*no direction specified*/);
    ist(tableMap.getNextCellPos(25, 'horizontal', -1), 1);
  });
});

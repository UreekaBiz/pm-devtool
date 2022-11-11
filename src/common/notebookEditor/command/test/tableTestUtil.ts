import { Node as ProseMirrorNode } from 'prosemirror-model';
import { NodeSelection, TextSelection } from 'prosemirror-state';

import { NodeName } from '../../node/type';
import { CellSelection } from '../../extension/table/class';
import { cellAround } from '../../extension/table/util';
import { AttributeType } from '../../attribute';
import { getNotebookSchemaNodeBuilders, validateNodeWithTag, ANCHOR, CURSOR, HEAD, NODE } from './testUtil';

// ********************************************************************************
// Command-testing utilities used by Table related test files

// == Constant ====================================================================
const {
  [NodeName.CELL]: defaultCellBuilder,
  [NodeName.HEADER_CELL]: defaultHeaderCellBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.CELL, NodeName.HEADER_CELL, NodeName.PARAGRAPH]);

// -- Cell ------------------------------------------------------------------------
export const cellBuilder = (colSpan: number, rowSpan: number) => {
  return defaultCellBuilder({ [AttributeType.ColSpan]: colSpan, [AttributeType.RowSpan]: rowSpan }, paragraphBuilder('x'));
};

export const defaultDimensionCellBuilder = cellBuilder(1, 1);
export const emptyCellBuilder = defaultCellBuilder(paragraphBuilder());
export const cellWithCursorBuilder = defaultCellBuilder(paragraphBuilder(`x<${CURSOR}>`));
export const cellWithAnchorBuilder = defaultCellBuilder(paragraphBuilder(`x<${ANCHOR}>`));
export const cellWithHeadBuilder = defaultCellBuilder(paragraphBuilder(`x<${HEAD}>`));

// -- HeaderCell ------------------------------------------------------------------
export const headerCellBuilder = (colSpan: number, rowSpan: number) => {
  return defaultHeaderCellBuilder({ [AttributeType.ColSpan]: colSpan, [AttributeType.RowSpan]: rowSpan }, paragraphBuilder('x'));
};
export const defaultDimensionHeaderCellBuilder = headerCellBuilder(1, 1);
export const emptyHeaderCellBuilder = defaultCellBuilder(paragraphBuilder());
export const headerCellWithCursorBuilder = defaultHeaderCellBuilder(paragraphBuilder(`x<${CURSOR}>`));

// == Util ========================================================================
// -- Table -----------------------------------------------------------------------
export const selectionForTableTest = (doc: ProseMirrorNode) => {
  if(!validateNodeWithTag(doc)) throw new Error('expected doc to have the Tag object and it does not');

  const cursor = doc.tag[CURSOR];
  if(cursor) return new TextSelection(doc.resolve(cursor));

  const $anchor = doc.tag[ANCHOR];
  if(!$anchor) throw new Error('expected anchor tag to exist in doc and it does not');

  const $cellAnchor = resolveCell(doc, $anchor);
  if($cellAnchor) {
    const head = doc.tag[HEAD];
    if(!head) throw new Error('expected head tag to exist in doc and it does not');

    return new CellSelection($cellAnchor, resolveCell(doc, head) || undefined);
  } /* else -- could not resolve cell at given anchor */

  const nodePos = doc.tag[NODE];
  if(nodePos) return new NodeSelection(doc.resolve(nodePos));

  return/*undefined*/;
};
// -- Cell ------------------------------------------------------------------------
const resolveCell = (doc: ProseMirrorNode, tag: number) => {
  if(!tag) return null;
  return cellAround(doc.resolve(tag));
};


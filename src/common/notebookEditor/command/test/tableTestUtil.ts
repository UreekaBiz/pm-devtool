import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { NodeSelection, TextSelection } from 'prosemirror-state';

import { NodeSpecs, SchemaV1 } from '../../../notebookEditor/schema';
import { NodeName } from '../../node/type';
import { CellSelection } from '../../extension/table/class';
import { CELL_COL_SPAN, CELL_ROW_SPAN } from '../../extension/table/node/cell';
import { cellAround } from '../../extension/table/util';
import { AttributeType } from '../../attribute';
import { getNotebookSchemaNodeBuilders, validateNodeWithTag, ANCHOR, CURSOR, HEAD, NODE } from './testUtil';

// ********************************************************************************
// Command-testing utilities used by Table related test files

// == Constant ====================================================================
// ensure that Table Nodes  have defined attributes and content expressions
// without being in web so that tests match the real scenario
// (SEE: getNotebookSchemaWithBuildersObj)
const defaultCellAttrs = { [AttributeType.ColSpan]: CELL_COL_SPAN, [AttributeType.RowSpan]: CELL_ROW_SPAN };
const modifiedSchemaNodeSpec = {
  ...NodeSpecs,
  [NodeName.CELL]: {
    ...SchemaV1.nodes[NodeName.CELL].spec,
    attrs: {
      [AttributeType.ColSpan]: { default: CELL_COL_SPAN },
      [AttributeType.RowSpan]: { default: CELL_ROW_SPAN },
    },
  },
  [NodeName.HEADER_CELL]: {
    ...SchemaV1.nodes[NodeName.HEADER_CELL].spec,
    attrs: {
      [AttributeType.ColSpan]: { default: CELL_COL_SPAN },
      [AttributeType.RowSpan]: { default: CELL_ROW_SPAN },
    },
  },
  [NodeName.ROW]: {
    ...SchemaV1.nodes[NodeName.ROW].spec,
    content: `(${NodeName.CELL} | ${NodeName.HEADER_CELL})*`,
  },
  [NodeName.TABLE]: {
    ...SchemaV1.nodes[NodeName.TABLE].spec,
    content: `${NodeName.ROW}+`,
  },
};
const schemaWithCellAttrs = new Schema({
  topNode: SchemaV1.topNodeType.name,
  marks: SchemaV1.spec.marks,
  nodes: modifiedSchemaNodeSpec,
});

export const {
  [NodeName.CELL]: defaultCellBuilder,
  [NodeName.HEADER_CELL]: defaultHeaderCellBuilder,
  [NodeName.ROW]: defaultRowBuilder,
  [NodeName.TABLE]: defaultTableBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.CELL, NodeName.HEADER_CELL, NodeName.ROW, NodeName.TABLE, NodeName.PARAGRAPH], schemaWithCellAttrs);


// -- Cell ------------------------------------------------------------------------
export const cellBuilder = defaultCellBuilder({ ...defaultCellAttrs }, paragraphBuilder('x'));
export const cellWithDimensionBuilder = (colSpan: number, rowSpan: number) => defaultCellBuilder({ [AttributeType.ColSpan]: colSpan, [AttributeType.RowSpan]: rowSpan }, paragraphBuilder('x'));

export const emptyCellBuilder = defaultCellBuilder({ ...defaultCellAttrs }, paragraphBuilder());
export const cellWithCursorBuilder = defaultCellBuilder({ ...defaultCellAttrs }, paragraphBuilder(`x<${CURSOR}>`));
export const cellWithAnchorBuilder = defaultCellBuilder({ ...defaultCellAttrs }, paragraphBuilder(`x<${ANCHOR}>`));
export const cellWithHeadBuilder = defaultCellBuilder({ ...defaultCellAttrs }, paragraphBuilder(`x<${HEAD}>`));

// -- HeaderCell ------------------------------------------------------------------
export const defaultDimensionWithParagraphHeaderCellBuilder = defaultHeaderCellBuilder({ ...defaultCellAttrs }, paragraphBuilder('x'));
export const emptyHeaderCellBuilder = defaultHeaderCellBuilder({ ...defaultCellAttrs }, paragraphBuilder());
export const headerCellWithCursorBuilder = defaultHeaderCellBuilder({ ...defaultCellAttrs }, paragraphBuilder(`x<${CURSOR}>`));

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


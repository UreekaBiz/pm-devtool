import ist from 'ist';
import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Command, EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';

import { NodeSpecs, SchemaV1 } from '../../../notebookEditor/schema';
import { NodeName } from '../../node/type';
import { CellSelection } from '../../extension/table/class';
import { CELL_COL_SPAN, CELL_ROW_SPAN } from '../../extension/table/node/cell';
import { getResolvedCellPosAroundResolvedPos } from '../../extension/table/util';
import { AttributeType } from '../../attribute';
import { getNotebookSchemaNodeBuilders, validateNodeWithTag, ANCHOR, CURSOR, HEAD, NODE } from './testUtil';

// ********************************************************************************
// Command-testing utilities used by Table related test files

// == Command =====================================================================
export const executeTableTestCommand = (doc: ProseMirrorNode, command: Command, resultingDoc: ProseMirrorNode | null) => {
  let state = EditorState.create({ doc, selection: selectionForTableTest(doc) });
  const commandExecutedSuccessfully = command(state, (tr) => (state = state.apply(tr)));

  if(resultingDoc === null) { ist(commandExecutedSuccessfully, false); }
  else { ist(state.doc, resultingDoc, eq); }
};

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

  // NOTE: contentMatch objects used by PM make comparison
  //       by object type instead of by properties (e.g. names of Nodes/Marks)
  //       hence, these doc and paragraph builders
  // .     must be used when testing Table Commands
  [NodeName.DOC]: tableDocBuilder,
  [NodeName.PARAGRAPH]: tableParagraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.CELL, NodeName.DOC, NodeName.HEADER_CELL, NodeName.ROW, NodeName.TABLE, NodeName.PARAGRAPH], schemaWithCellAttrs);


// -- Cell ------------------------------------------------------------------------
export const cellBuilder = defaultCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder('x'));
export const cellWithDimensionBuilder = (colSpan: number, rowSpan: number) => defaultCellBuilder({ [AttributeType.ColSpan]: colSpan, [AttributeType.RowSpan]: rowSpan }, tableParagraphBuilder('x'));

export const emptyCellBuilder = defaultCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder());
export const cellWithCursorBuilder = defaultCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder(`x<${CURSOR}>`));
export const cellWithAnchorBuilder = defaultCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder(`x<${ANCHOR}>`));
export const cellWithHeadBuilder = defaultCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder(`x<${HEAD}>`));
export const colWidth100CellBuilder = defaultCellBuilder({ [AttributeType.ColWidth]: [100] }, tableParagraphBuilder('x'));
export const colWidth200CellBuilder = defaultCellBuilder({ [AttributeType.ColWidth]: [200] }, tableParagraphBuilder('x'));

// -- HeaderCell ------------------------------------------------------------------
export const headerCellWithDimensionBuilder = (colSpan: number, rowSpan: number) => defaultHeaderCellBuilder({ [AttributeType.ColSpan]: colSpan, [AttributeType.RowSpan]: rowSpan }, tableParagraphBuilder('x'));

export const headerCellBuilder = defaultHeaderCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder('x'));
export const emptyHeaderCellBuilder = defaultHeaderCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder());
export const headerCellWithCursorBuilder = defaultHeaderCellBuilder({ ...defaultCellAttrs }, tableParagraphBuilder(`x<${CURSOR}>`));

// == Util ========================================================================
// -- Table -----------------------------------------------------------------------
export const selectionForTableTest = (doc: ProseMirrorNode) => {
  if(!validateNodeWithTag(doc)) throw new Error('expected doc to have the Tag object and it does not');

  const cursor = doc.tag[CURSOR];
  if(cursor) return new TextSelection(doc.resolve(cursor));

  const $anchor = doc.tag[ANCHOR];
  const $cellAnchor = resolveCell(doc, $anchor);
  if($cellAnchor) {
    const head = doc.tag[HEAD];
    return new CellSelection($cellAnchor, resolveCell(doc, head) || undefined);
  } /* else -- could not resolve cell at given anchor */

  const nodePos = doc.tag[NODE];
  if(nodePos) return new NodeSelection(doc.resolve(nodePos));

  return/*undefined*/;
};
// -- Cell ------------------------------------------------------------------------
const resolveCell = (doc: ProseMirrorNode, tag: number | null) => {
  if(!tag) return null;
  return getResolvedCellPosAroundResolvedPos(doc.resolve(tag));
};


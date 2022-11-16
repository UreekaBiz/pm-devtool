import { MdOutlineTableChart } from 'react-icons/md';
import { TiDeleteOutline } from 'react-icons/ti';
import { RiDeleteColumn, RiDeleteRow, RiInsertColumnLeft, RiInsertColumnRight, RiInsertRowBottom, RiInsertRowTop, RiMore2Line, RiMoreLine } from 'react-icons/ri';

import { addColumnAfterCommand, addColumnBeforeCommand, addRowAfterCommand, addRowBeforeCommand, createAndInsertTableCommand, deleteColumnCommand, deleteRowCommand, deleteTable, isTableNode, toggleHeaderColumnCommand, toggleHeaderRowCommand, NodeName, SelectionDepth, TABLE_DEFAULT_COLUMNS, TABLE_DEFAULT_ROWS, TABLE_DEFAULT_WITH_HEDER_ROW } from 'common';

import { Editor } from 'notebookEditor/editor';
import { toolItemCommandWrapper } from 'notebookEditor/command';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

//*********************************************************************************
// == Tool Items ==================================================================
export const tableToolItem: ToolItem = {
  toolType: 'button',

  name: NodeName.TABLE,
  label: NodeName.TABLE,

  icon: <MdOutlineTableChart size={16} />,
  tooltip: 'Add a Table',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, createAndInsertTableCommand(TABLE_DEFAULT_ROWS, TABLE_DEFAULT_COLUMNS, TABLE_DEFAULT_WITH_HEDER_ROW)),
};

// -- Table -----------------------------------------------------------------------
export const deleteTableToolItem: ToolItem = {
  toolType: 'button',
  name: 'Delete Table',
  label: 'Delete Table',
  icon: <TiDeleteOutline size={16} />,
  tooltip: 'Delete Table',

  shouldBeDisabled: (editor) => {
    if(editor.isNodeOrMarkActive(NodeName.TABLE)) return false;
    /* else -- table not active */

    return true;
  },
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, deleteTable),
};

// -- Row -------------------------------------------------------------------------
export const deleteRowToolItem: ToolItem = {
  toolType: 'button',
  name: 'Delete Row',
  label: 'Delete Row',
  icon: <RiDeleteRow size={16} />,
  tooltip: 'Delete Row',
  shouldBeDisabled: (editor) => {
    if(editor.isNodeOrMarkActive(NodeName.TABLE)) return false;
    /* else -- table not active */

    return true;
  },
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, deleteRowCommand),
};

export const addRowAboveToolItem: ToolItem = {
  toolType: 'button',
  name: 'Add Row Above',
  label: 'Add Row Above',
  icon: <RiInsertRowTop size={16} />,
  tooltip: 'Add Row Above',
  shouldBeDisabled: (editor) => {
    if(editor.isNodeOrMarkActive(NodeName.TABLE)) return false;
    /* else -- table not active */

    return true;
  },
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, addRowBeforeCommand),
};

export const addRowBelowToolItem: ToolItem = {
  toolType: 'button',
  name: 'Add Row Below',
  label: 'Add Row Below',
  icon: <RiInsertRowBottom size={16} />,
  tooltip: 'Add Row Below',
  shouldBeDisabled: (editor) => {
    if(editor.isNodeOrMarkActive(NodeName.TABLE)) return false;
    /* else -- table not active */

    return true;
  },
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, addRowAfterCommand),
};

// -- Column ----------------------------------------------------------------------
export const deleteColumnToolItem: ToolItem = {
  toolType: 'button',
  name: 'Delete Column',
  label: 'Delete Column',
  icon: <RiDeleteColumn size={16} />,
  tooltip: 'Delete Column',
  shouldBeDisabled: (editor) => {
    if(editor.isNodeOrMarkActive(NodeName.TABLE)) return false;
    /* else -- table not active */

    return true;
  },
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, deleteColumnCommand),
};

export const addColumnBeforeToolItem: ToolItem = {
  toolType: 'button',
  name: 'Add Column Before',
  label: 'Add Column Before',
  icon: <RiInsertColumnLeft size={16} />,
  tooltip: 'Add Column Before',
  shouldBeDisabled: (editor) => {
    if(editor.isNodeOrMarkActive(NodeName.TABLE)) return false;
    /* else -- table not active */

    return true;
  },
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, addColumnBeforeCommand),
};

export const addColumnAfterToolItem: ToolItem = {
  toolType: 'button',
  name: 'Add Column After',
  label: 'Add Column After',
  icon: <RiInsertColumnRight size={16} />,
  tooltip: 'Add Column After',
  shouldBeDisabled: (editor) => {
    if(editor.isNodeOrMarkActive(NodeName.TABLE)) return false;
    /* else -- table not active */

    return true;
  },
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, addColumnAfterCommand),
};

// -- Header ----------------------------------------------------------------------
export const toggleHeaderInFirstRowToolItem: ToolItem = {
  toolType: 'button',
  name: 'Toggle Header in First Row',
  label: 'Toggle Header in First Row',
  icon: <RiMoreLine size={16} />,
  tooltip: 'Toggle Header in First Row',

  shouldBeDisabled: (editor) => !editor.isNodeOrMarkActive(NodeName.TABLE),
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleHeaderRowCommand),
};

export const toggleHeaderInFirstColumnToolItem: ToolItem = {
  toolType: 'button',
  name: 'Toggle Header in First Column',
  label: 'Toggle Header in First Column',
  icon: <RiMore2Line size={16} />,
  tooltip: 'Toggle Header in First Column',

  shouldBeDisabled: (editor) => !editor.isNodeOrMarkActive(NodeName.TABLE),
  shouldShow: (editor, depth) => shouldShowTableToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleHeaderColumnCommand),
};

// --------------------------------------------------------------------------------
export const generalTableToolItems: ToolItem[] = [
  deleteTableToolItem,
  deleteRowToolItem,
  addRowAboveToolItem,
  addRowBelowToolItem,
  deleteColumnToolItem,
  addColumnBeforeToolItem,
  addColumnAfterToolItem,
  toggleHeaderInFirstRowToolItem,
  toggleHeaderInFirstColumnToolItem,
];

// == Util ========================================================================
const shouldShowTableToolItem = (editor: Editor, depth: SelectionDepth) => {
  const { $anchor } = editor.view.state.selection;

  const expectedTable = $anchor.node(-3/*Table Depth*/);
  if(expectedTable && isTableNode(expectedTable)) {
    return depth === $anchor.depth - 3/*Table Depth*/;
  } /* else -- not inside Table at right depth, return default */

  return shouldShowToolItem(editor, depth)/*default*/;
};

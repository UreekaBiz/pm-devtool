import { GrFormNextLink, GrFormPreviousLink } from 'react-icons/gr';
import { IoMdSquareOutline } from 'react-icons/io';
import { RiMergeCellsHorizontal, RiSplitCellsHorizontal } from 'react-icons/ri';

import { goToCellCommand, isCellNode, isCellSelection, isHeaderCellNode, mergeCellsCommand, splitCellCommand, toggleHeaderCellCommand, SelectionDepth } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { Editor } from 'notebookEditor/editor/Editor';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

//*********************************************************************************
// == ToolItems ===================================================================
export const goToPreviousCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Go to previous Cell',
  label: 'Go to previous Cell',
  icon: <GrFormPreviousLink size={16} />,
  tooltip: 'Go to previous Cell',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor, depth) => shouldShowCellToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, goToCellCommand('previous')),
};

export const goToNextCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Go to next Cell',
  label: 'Go to next Cell',
  icon: <GrFormNextLink size={16} />,
  tooltip: 'Go to next Cell',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor, depth) => shouldShowCellToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, goToCellCommand('next')),
};

export const mergeCellsToolItem: ToolItem = {
  toolType: 'button',
  name: 'Merge Cells',
  label: 'Merge Cells',
  icon: <RiMergeCellsHorizontal size={16} />,
  tooltip: 'Merge Cells',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor, depth) => shouldShowCellToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, mergeCellsCommand),
};

export const splitCellsToolItem: ToolItem = {
  toolType: 'button',
  name: 'Split Cells',
  label: 'Split Cells',
  icon: <RiSplitCellsHorizontal size={16} />,
  tooltip: 'Split Cells',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor, depth) => shouldShowCellToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, splitCellCommand()),
};

export const toggleHeaderCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Toggle Header in Cell',
  label: 'Toggle Header in Cell',
  icon: <IoMdSquareOutline size={16} />,
  tooltip: 'Toggle Header in Cell',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor, depth) => shouldShowCellToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleHeaderCellCommand),
};

// --------------------------------------------------------------------------------
export const cellToolItems = [
  goToPreviousCellToolItem,
  goToNextCellToolItem,
  mergeCellsToolItem,
  splitCellsToolItem,
  toggleHeaderCellToolItem,
];

// == Util ========================================================================
const shouldShowCellToolItem = (editor: Editor, depth: SelectionDepth) => {
  const { selection } = editor.view.state;
  const { $anchor } = selection;

  const negativeDepth = isCellSelection(selection) ? 0/*CellSelection Depth*/ : -1/*Cell Depth*/;
  const expectedCell = $anchor.node(negativeDepth);
  if(expectedCell && (isCellNode(expectedCell) || isHeaderCellNode(expectedCell))) {
    return depth === ($anchor.depth - Math.abs(negativeDepth));
  } /* else -- not inside Cell at right depth, return default */

  return shouldShowToolItem(editor, depth)/*default*/;
};

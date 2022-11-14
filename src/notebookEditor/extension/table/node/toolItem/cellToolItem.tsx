import { GrFormNextLink, GrFormPreviousLink } from 'react-icons/gr';
import { IoMdSquareOutline } from 'react-icons/io';
import { RiMergeCellsHorizontal, RiSplitCellsHorizontal } from 'react-icons/ri';

import { goToCellCommand, mergeCellsCommand, splitCellCommand } from 'common';

import { ToolItem } from 'notebookEditor/toolbar/type';
import { toolItemCommandWrapper } from 'notebookEditor/command';

import { toggleHeaderCell } from '../headerCell/command';

//*********************************************************************************
// == ToolItems ===================================================================
export const goToPreviousCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Go to previous Cell',
  label: 'Go to previous Cell',
  icon: <GrFormPreviousLink size={16} />,
  tooltip: 'Go to previous Cell',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor) => true,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, goToCellCommand('previous')),
};

export const goToNextCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Go to next Cell',
  label: 'Go to next Cell',
  icon: <GrFormNextLink size={16} />,
  tooltip: 'Go to next Cell',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor) => true,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, goToCellCommand('next')),
};

export const mergeCellsToolItem: ToolItem = {
  toolType: 'button',
  name: 'Merge Cells',
  label: 'Merge Cells',
  icon: <RiMergeCellsHorizontal size={16} />,
  tooltip: 'Merge Cells',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor) => true,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, mergeCellsCommand),
};

export const splitCellsToolItem: ToolItem = {
  toolType: 'button',
  name: 'Split Cells',
  label: 'Split Cells',
  icon: <RiSplitCellsHorizontal size={16} />,
  tooltip: 'Split Cells',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor) => true,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, splitCellCommand()),
};

export const toggleHeaderCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Toggle Header in Cell',
  label: 'Toggle Header in Cell',
  icon: <IoMdSquareOutline size={16} />,
  tooltip: 'Toggle Header in Cell',

  shouldBeDisabled: (editor) => false,
  shouldShow: (editor) => true,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleHeaderCell),
};

// --------------------------------------------------------------------------------
export const cellToolItems = [
  goToPreviousCellToolItem,
  goToNextCellToolItem,
  mergeCellsToolItem,
  splitCellsToolItem,
  toggleHeaderCellToolItem,
];

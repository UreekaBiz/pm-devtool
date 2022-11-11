import { GrFormNextLink, GrFormPreviousLink } from 'react-icons/gr';
import { IoMdSquareOutline } from 'react-icons/io';
import { RiMergeCellsHorizontal, RiSplitCellsHorizontal } from 'react-icons/ri';
import { TiArrowSync } from 'react-icons/ti';

import { isCellSelection, NodeName } from 'common';

import { ToolItem } from 'notebookEditor/toolbar/type';
import { toolItemCommandWrapper } from 'notebookEditor/command';

import { goToCell, mergeCells, mergeOrSplitCommand, splitCell } from '../cell/command';
import { toggleHeaderCell } from '../headerCell/command';

//*********************************************************************************
// == ToolItems ===================================================================
export const goToPreviousCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Go to previous Cell',
  label: 'Go to previous Cell',
  icon: <GrFormPreviousLink size={16} />,
  tooltip: 'Go to previous Cell',

  shouldBeDisabled: (editor) => !editor.isNodeOrMarkActive(NodeName.CELL) && !editor.isNodeOrMarkActive(NodeName.HEADER_CELL),
  shouldShow: (editor) => true,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, goToCell('previous')),
};

export const goToNextCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Go to next Cell',
  label: 'Go to next Cell',
  icon: <GrFormNextLink size={16} />,
  tooltip: 'Go to next Cell',

  shouldBeDisabled: (editor) => !editor.isNodeOrMarkActive(NodeName.CELL) && !editor.isNodeOrMarkActive(NodeName.HEADER_CELL),
  shouldShow: (editor) => true,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, goToCell('next')),
};

export const mergeCellsToolItem: ToolItem = {
  toolType: 'button',
  name: 'Merge Cells',
  label: 'Merge Cells',
  icon: <RiMergeCellsHorizontal size={16} />,
  tooltip: 'Merge Cells',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.view.state;
    if((editor.isNodeOrMarkActive(NodeName.CELL) || editor.isNodeOrMarkActive(NodeName.HEADER_CELL)) && isCellSelection(selection)) return false;
    /* else -- user does not have many cells selected */

    return true;
  },
  shouldShow: (editor) => isCellSelection(editor.view.state.selection),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, mergeCells),
};

export const splitCellsToolItem: ToolItem = {
  toolType: 'button',
  name: 'Split Cells',
  label: 'Split Cells',
  icon: <RiSplitCellsHorizontal size={16} />,
  tooltip: 'Split Cells',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.view.state;
    if((editor.isNodeOrMarkActive(NodeName.CELL) || editor.isNodeOrMarkActive(NodeName.HEADER_CELL)) && isCellSelection(selection)) return false;
    /* else -- user does not have many cells selected */

    return true;
  },
  shouldShow: (editor) => isCellSelection(editor.view.state.selection),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, splitCell),
};

export const mergeOrSplitCellsToolItem: ToolItem = {
  toolType: 'button',
  name: 'Merge or Split',
  label: 'Merge or Split',
  icon: <TiArrowSync size={16} />,
  tooltip: 'Merge or Split',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.view.state;
    if((editor.isNodeOrMarkActive(NodeName.CELL) || editor.isNodeOrMarkActive(NodeName.HEADER_CELL)) && isCellSelection(selection)) return false;
    /* else -- user does not have many cells selected */

    return true;
  },
  shouldShow: (editor) => isCellSelection(editor.view.state.selection),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, mergeOrSplitCommand),
};

export const toggleHeaderCellToolItem: ToolItem = {
  toolType: 'button',
  name: 'Toggle Header in Cell',
  label: 'Toggle Header in Cell',
  icon: <IoMdSquareOutline size={16} />,
  tooltip: 'Toggle Header in Cell',

  shouldBeDisabled: (editor) => !editor.isNodeOrMarkActive(NodeName.CELL) && !editor.isNodeOrMarkActive(NodeName.HEADER_CELL),
  shouldShow: (editor) => isCellSelection(editor.view.state.selection),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, toggleHeaderCell),
};

// --------------------------------------------------------------------------------
export const cellToolItems = [
  goToPreviousCellToolItem,
  goToNextCellToolItem,
  mergeCellsToolItem,
  splitCellsToolItem,
  mergeOrSplitCellsToolItem,
  toggleHeaderCellToolItem,
];

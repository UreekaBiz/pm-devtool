import { GrFormNextLink, GrFormPreviousLink } from 'react-icons/gr';
import { IoMdSquareOutline } from 'react-icons/io';
import { RiMergeCellsHorizontal, RiSplitCellsHorizontal } from 'react-icons/ri';
import { TiArrowSync } from 'react-icons/ti';

import { NodeName } from 'common';

import { parentIsOfType } from 'notebookEditor/extension/util/node';
import { Toolbar } from 'notebookEditor/toolbar/type';

import { isCellSelection } from '../util';

//*********************************************************************************
export const CellToolbar: Toolbar = {
  nodeName: NodeName.CELL,
  toolsCollections: [
    [
      {
        toolType: 'button',
        name: 'Go to previous Cell',
        label: 'Go to previous Cell',
        icon: <GrFormPreviousLink size={16} />,
        tooltip: 'Go to previous Cell',

        shouldBeDisabled: (editor) => !editor.isActive(NodeName.CELL) && !editor.isActive(NodeName.HEADER),
        shouldShow: (editor) => parentIsOfType(editor.state.selection, NodeName.PARAGRAPH),
        onClick: (editor) => editor.chain().focus().goToPreviousCell().run(),
      },
      {
        toolType: 'button',
        name: 'Go to next Cell',
        label: 'Go to next Cell',
        icon: <GrFormNextLink size={16} />,
        tooltip: 'Go to next Cell',

        shouldBeDisabled: (editor) => !editor.isActive(NodeName.CELL) && !editor.isActive(NodeName.HEADER),
        shouldShow: (editor) => parentIsOfType(editor.state.selection, NodeName.PARAGRAPH),
        onClick: (editor) => editor.chain().focus().goToNextCell().run(),
      },
      {
        toolType: 'button',
        name: 'Merge Cells',
        label: 'Merge Cells',
        icon: <RiMergeCellsHorizontal size={16} />,
        tooltip: 'Merge Cells',

        shouldBeDisabled: (editor) => {
          const { selection } = editor.state;
          if((editor.isActive(NodeName.CELL) || editor.isActive(NodeName.HEADER)) && isCellSelection(selection)) return false;
          /* else -- user does not have many cells selected */

          return true;
        },
        shouldShow: (editor) => parentIsOfType(editor.state.selection, NodeName.PARAGRAPH) || editor.state.selection.toJSON().type === NodeName.CELL,
        onClick: (editor) => editor.chain().focus().mergeCells().run(),
      },
      {
        toolType: 'button',
        name: 'Split Cells',
        label: 'Split Cells',
        icon: <RiSplitCellsHorizontal size={16} />,
        tooltip: 'Split Cells',

        shouldBeDisabled: (editor) => {
          const { selection } = editor.state;
          if((editor.isActive(NodeName.CELL) || editor.isActive(NodeName.HEADER)) && isCellSelection(selection)) return false;
          /* else -- user does not have many cells selected */

          return true;
        },
        shouldShow: (editor) => parentIsOfType(editor.state.selection, NodeName.PARAGRAPH) || editor.state.selection.toJSON().type === NodeName.CELL,
        onClick: (editor) => editor.chain().focus().splitCell().run(),
      },
      {
        toolType: 'button',
        name: 'Merge or Split',
        label: 'Merge or Split',
        icon: <TiArrowSync size={16} />,
        tooltip: 'Merge or Split',

        shouldBeDisabled: (editor) => {
          const { selection } = editor.state;
          if((editor.isActive(NodeName.CELL) || editor.isActive(NodeName.HEADER)) && isCellSelection(selection)) return false;
          /* else -- user does not have many cells selected */

          return true;
        },
        shouldShow: (editor) => parentIsOfType(editor.state.selection, NodeName.PARAGRAPH) || editor.state.selection.toJSON().type === NodeName.CELL,
        onClick: (editor) => editor.chain().focus().mergeOrSplit().run(),
      },
      {
        toolType: 'button',
        name: 'Toggle Header in Cell',
        label: 'Toggle Header in Cell',
        icon: <IoMdSquareOutline size={16} />,
        tooltip: 'Toggle Header in Cell',

        shouldBeDisabled: (editor) => !editor.isActive(NodeName.CELL) && !editor.isActive(NodeName.HEADER),
        shouldShow: (editor) => parentIsOfType(editor.state.selection, NodeName.PARAGRAPH) || editor.state.selection.toJSON().type === NodeName.CELL,
        onClick: (editor) => editor.chain().focus().toggleHeaderCell().run(),
      },
    ],
  ],
};

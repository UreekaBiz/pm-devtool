import { BiBold } from 'react-icons/bi';

import { getBoldMarkType, isNodeSelection, setMarkCommand, MarkName } from 'common';

import { getMarkHolder, inMarkHolder, toggleMarkInMarkHolderCommand } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toolItemCommandWrapper } from '../util/command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markBold: ToolItem = {
  toolType: 'button',
  name: MarkName.BOLD,
  label: MarkName.BOLD,

  icon: <BiBold size={16} />,
  tooltip: 'Bold (⌘ + B)',

  shouldBeDisabled: (editor) => {
    const { selection } = editor.state;
    if(!isNodeSelection(selection)) return false;

    return true;
  },
  shouldShow: (editor, depth) => depth === undefined || editor.state.selection.$anchor.depth === depth/*direct parent*/,
  onClick: (editor, depth) => {
    // if MarkHolder is defined toggle the Mark inside it
    const { state } = editor;
    const markHolder = getMarkHolder(state);

    if(markHolder) {
      return toolItemCommandWrapper(editor, depth, toggleMarkInMarkHolderCommand(markHolder, getBoldMarkType(editor.schema)));
    }/* else -- no MarkHolder present */

    return toolItemCommandWrapper(editor, depth, setMarkCommand(state.schema, MarkName.BOLD, {/*no attributes*/}));
  },

  isActive: (editor) => {
    if(inMarkHolder(editor,  MarkName.BOLD)) return true/*is active in MarkHolder*/;

    return editor.isActive(MarkName.BOLD);
  },
};

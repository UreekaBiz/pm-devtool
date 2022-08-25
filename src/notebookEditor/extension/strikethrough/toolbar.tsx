import { BiStrikethrough } from 'react-icons/bi';

import { getStrikethroughMarkType, setMarkCommand, isNodeSelection, MarkName } from 'common';

import { getMarkHolder, inMarkHolder, toggleMarkInMarkHolderCommand } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { toolItemCommandWrapper } from '../util/command';

// ********************************************************************************
// == Tool Items ==================================================================
export const markStrikethrough: ToolItem = {
  toolType: 'button',
  name: MarkName.STRIKETHROUGH,
  label: MarkName.STRIKETHROUGH,

  icon: <BiStrikethrough size={16} />,
  tooltip: 'Strikethrough (⌘ + ⇧ + X)',

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
      return toolItemCommandWrapper(editor, depth, toggleMarkInMarkHolderCommand(markHolder, getStrikethroughMarkType(editor.schema)));
    }/* else -- no MarkHolder present */

    return toolItemCommandWrapper(editor, depth, setMarkCommand(state.schema, MarkName.STRIKETHROUGH, {/*no attributes*/}));
  },

  isActive: (editor) => {
    if(inMarkHolder(editor,  MarkName.STRIKETHROUGH)) return true/*is active in MarkHolder*/;

    return editor.isActive(MarkName.STRIKETHROUGH);
  },
};

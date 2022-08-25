import { BiStrikethrough } from 'react-icons/bi';

import { getStrikethroughMarkType, setMarkCommand, isNodeSelection, MarkName } from 'common';

import { getMarkHolder, inMarkHolder, toggleMarkInMarkHolderCommand } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

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
  onClick: (editor) => {
    // if MarkHolder is defined toggle the Mark inside it
    const { state, view } = editor;
    const { dispatch } = view;
    const markHolder = getMarkHolder(state);

    if(markHolder) {
      return toggleMarkInMarkHolderCommand(markHolder, getStrikethroughMarkType(editor.schema))(state, dispatch);
    }/* else -- no MarkHolder present */

    return setMarkCommand(state.schema, MarkName.STRIKETHROUGH, {/*no attributes*/})(state, dispatch);
  },

  isActive: (editor) => {
    if(inMarkHolder(editor,  MarkName.STRIKETHROUGH)) return true/*is active in MarkHolder*/;

    return editor.isActive(MarkName.STRIKETHROUGH);
  },
};

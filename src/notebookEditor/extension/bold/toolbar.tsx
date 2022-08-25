import { BiBold } from 'react-icons/bi';

import { getBoldMarkType, isNodeSelection, setMarkCommand, MarkName } from 'common';

import { getMarkHolder, inMarkHolder, toggleMarkInMarkHolderCommand } from 'notebookEditor/extension/markHolder/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

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
  onClick: (editor) => {
    // if MarkHolder is defined toggle the Mark inside it
    const { state, view } = editor;
    const { dispatch } = view;
    const markHolder = getMarkHolder(state);

    if(markHolder) {
      return toggleMarkInMarkHolderCommand(markHolder, getBoldMarkType(editor.schema))(state, dispatch);
    }/* else -- no MarkHolder present */

    return setMarkCommand(state.schema, MarkName.BOLD, {/*no attributes*/})(state, dispatch);
  },

  isActive: (editor) => {
    if(inMarkHolder(editor,  MarkName.BOLD)) return true/*is active in MarkHolder*/;

    return editor.isActive(MarkName.BOLD);
  },
};

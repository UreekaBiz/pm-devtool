import { BiBold } from 'react-icons/bi';

import { getBoldMarkType, isBoldMark, MarkName, SchemaV1 } from 'common';

import { toggleMarkInMarkHolder, getMarkHolder } from 'notebookEditor/extension/markHolder/util';
import { isNodeSelection } from 'notebookEditor/extension/util/node';
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
    // If MarkHolder is defined toggle the mark inside it.
    const markHolder = getMarkHolder(editor);
    if(markHolder) return toggleMarkInMarkHolder(editor.state.selection, editor.chain, markHolder, getBoldMarkType(SchemaV1))/*nothing else to do*/;
    // else -- MarkHolder is not present

    return editor.chain().focus().toggleBold().run();
  },

  isActive: (editor) => {
    const markHolder = getMarkHolder(editor);
    if(markHolder && markHolder.attrs.storedMarks?.some(mark => isBoldMark(mark))) {
      return true;
    }/* else -- return default check */

    return editor.isActive(MarkName.BOLD);
  },
};

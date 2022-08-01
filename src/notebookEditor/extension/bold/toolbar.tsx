import { BiBold } from 'react-icons/bi';
import { TextSelection } from 'prosemirror-state';

import { MarkName } from 'common';

import { isMarkHolderPresent } from 'notebookEditor/extension/markHolder/MarkHolder';
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
    const markHolder = isMarkHolderPresent(editor);
    if(markHolder && markHolder.attrs.storedMarks?.some(mark => mark.type.name === MarkName.BOLD)) {
      // remove the bold mark since its already included
      return editor.chain().focus().command((props) => {
        const { dispatch, tr } = props;
        if(!dispatch) throw new Error('dispatch undefined when it should not');

        const startOfParentNodePos = tr.doc.resolve(editor.state.selection.$anchor.pos - editor.state.selection.$anchor.parentOffset);
        const startingSelection = tr.selection;

        tr.setSelection(new TextSelection(startOfParentNodePos, tr.doc.resolve(startOfParentNodePos.pos + markHolder.nodeSize)))
          .setNodeMarkup(tr.selection.$anchor.pos, undefined/*maintain type*/, { storedMarks: [ ...markHolder.attrs.storedMarks!/*defined by contract*/.filter(mark => mark.type.name !== MarkName.BOLD)] })
          .setSelection(new TextSelection(tr.doc.resolve(startingSelection.$anchor.pos)));
        dispatch(tr);
        return true;
      }).run();
    }/* else -- MarkHolder not present, return default action */

    return editor.chain().focus().toggleBold().run();
  },

  isActive: (editor) => {
    const markHolder = isMarkHolderPresent(editor);
    if(markHolder && markHolder.attrs.storedMarks?.some(mark => mark.type.name === MarkName.BOLD)) {
      return true;
    }/* else -- return default check */

    return editor.isActive(MarkName.BOLD);
  },
};

import { ChainedCommands, Editor } from '@tiptap/core';
import { Mark, MarkType } from 'prosemirror-model';
import { Selection, TextSelection } from 'prosemirror-state';

import { isMarkHolderNode, JSONNode, MarkHolderNodeType, MarkName, NodeName } from 'common';


// ********************************************************************************
// creates a MarkHolder Node holding the Marks corresponding to the given MarkNames
export const createMarkHolderJSONNode = (editor: Editor, markNames: MarkName[]): JSONNode => {
  const storedMarks = markNames.map(markName => editor.schema.marks[markName].create());
  const node = editor.schema.nodes[NodeName.MARK_HOLDER].create({ storedMarks });

  return node.toJSON() as JSONNode;
};

/**
 * Checks to see whether or not the first child of the parent of the current Editor
 * {@link Selection} is a MarkHolderNode. It returns it if it is, and otherwise it
 * returns false
 */
export const getMarkHolder = (editor: Editor) => {
  const { firstChild } = editor.state.selection.$anchor.parent;
  if(firstChild && isMarkHolderNode(firstChild)) return firstChild;
  /* else -- firstChild does not exist or is not a MarkHolder */

  return undefined/*not found*/;
};

/**
 * Ensure that toggling of Marks whenever a MarkHolder is present on a BlockNode
 * modifies the Marks that it has inside of it
 */
// NOTE: the parameters of this function are set specifically such that the function
//       can be used both by ToolItems and commands. Since editor.chain is not of
//       the same type as the chain returned by CommandProps, not doing this causes
//       a 'MismatchedTransaction' error
export const handleMarkHolderPresence = (selection: Selection, chain: () => ChainedCommands, markHolder: MarkHolderNodeType, appliedMarkType: MarkType): boolean => {
  let newMarksArray: Mark[] = [];
  if(markHolder.attrs.storedMarks?.some(mark => mark.type.name === appliedMarkType.name)) {
    // mark already included, remove it
    newMarksArray = [...markHolder.attrs.storedMarks!/*defined by contract*/.filter(mark => mark.type.name !== appliedMarkType.name)];
  } else {
    // mark not included yet, add it
    newMarksArray = [...markHolder.attrs.storedMarks!/*defined by contract*/, appliedMarkType.create()];
  }

  return chain().focus().command((props) => {
    const { dispatch, tr } = props;
    // FIXME: throws?
    if(!dispatch) throw new Error('dispatch undefined when it should not');

    const startOfParentNodePos = tr.doc.resolve(selection.$anchor.pos - selection.$anchor.parentOffset);
    const { pos: startingPos } = tr.selection.$anchor;

    tr.setSelection(new TextSelection(startOfParentNodePos, tr.doc.resolve(startOfParentNodePos.pos + markHolder.nodeSize)))
      .setNodeMarkup(tr.selection.$anchor.pos, undefined/*maintain type*/, { storedMarks: newMarksArray })
      .setSelection(new TextSelection(tr.doc.resolve(startingPos)));

    dispatch(tr);
    return true/*FIXME: What does true means?*/;
  }).run();
};

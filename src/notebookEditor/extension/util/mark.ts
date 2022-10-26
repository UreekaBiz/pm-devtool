import { Mark as ProseMirrorMark } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

// ********************************************************************************
// == Selection ===================================================================
/** Gets all the ascendants of the current selected Node */
export const getAllMarksFromSelection = (state: EditorState): readonly ProseMirrorMark[] => {
  const { selection } = state;
  const { $anchor } = selection;

  return $anchor.marks();
};

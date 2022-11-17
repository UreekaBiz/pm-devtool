import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { MarkName, NodeName } from 'common';

// == Node ========================================================================
/**
 * get the Attributes of the {@link ProseMirrorNode} at the Selection
 * if it is present
 */
// FIXME: from state?
export const getNodeAttributesFromView = (state: EditorState, nodeName: NodeName) => {
  const nodes: ProseMirrorNode[] = [/*default empty*/];

  const { from, to } = state.selection;
  state.doc.nodesBetween(from, to, (node) => { nodes.push(node); });

  const node = nodes.reverse(/*from most nested to least nested*/).find(nodeItem => nodeItem.type.name === nodeName);
  if(!node) {
    return {/*no attrs*/};
  } /* else -- return the Node's attrs */

  return { ...node.attrs };
};

// == Mark ========================================================================
/**
 * get the Attributes of the {@link ProseMirrorMark} at the Selection
 * if it is present
 */
// FIXME: from state?
 export const getMarkAttributesFromView = (state: EditorState, markName: MarkName) => {
  const { from, to, empty } = state.selection;
  const marks: ProseMirrorMark[] = [/*default empty*/];

  if(empty) {
    if(state.storedMarks) {
      marks.push(...state.storedMarks);
    } /* else -- no stored Marks */
    marks.push(...state.selection.$head.marks());

  } else {
    state.doc.nodesBetween(from, to, node => { marks.push(...node.marks); });
  }

  const mark = marks.find(markItem => markItem.type.name === markName);
  if(!mark) {
    return {/*no attrs*/};
  } /* else -- return Mark's attrs */

  return { ...mark.attrs };
};


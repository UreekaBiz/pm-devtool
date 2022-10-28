import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { objectIncludes, Attributes, MarkName, NodeName, MarkRange } from 'common';

// == Node ========================================================================
/**
 * get the {@link Attributes} of the {@link ProseMirrorNode} at the Selection
 * if it is present
 */
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

/**
 * check if a Node of the given {@link NodeName} is
 * currently present in the given {@link EditorState}'s Selection
 */
export const isNodeActive = (state: EditorState, nodeName: NodeName, attributes: Attributes): boolean => {
  const { from, to, empty } = state.selection;
  const nodesWithRange: { node: ProseMirrorNode; from: number; to: number; }[] = [];

  state.doc.nodesBetween(from, to, (node, pos) => {
    if(node.isText) return/*nothing to do*/;

    const relativeFrom = Math.max(from, pos);
    const relativeTo = Math.min(to, pos + node.nodeSize);

    nodesWithRange.push({ node, from: relativeFrom, to: relativeTo });
  });

  const selectionRange = to - from;
  const matchedNodeRanges = nodesWithRange
    .filter(nodeWithRange => nodeName === nodeWithRange.node.type.name)
    .filter(nodeWithRange => objectIncludes(nodeWithRange.node.attrs, attributes));

  if(empty) return !!matchedNodeRanges.length/*no matched nodes*/;

  const range = matchedNodeRanges.reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0/*initial*/);
  return range >= selectionRange;
};

// == Mark ========================================================================
/**
 * get the {@link Attributes} of the {@link ProseMirrorMark} at the Selection
 * if it is present
 */
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

/**
 * check if a Node of the given {@link NodeName} is
 * currently present in the given {@link EditorState}'s Selection
 */
export const isMarkActive = (state: EditorState, markName: MarkName, attributes: Attributes): boolean => {
  const { empty, ranges } = state.selection;

  if(empty) {
    return !!(state.storedMarks || state.selection.$from.marks())
      .filter((mark) => mark.type.name === markName)
      .find(mark => objectIncludes(mark.attrs, attributes));
  } /* else -- Selection is not empty */

  let selectionRange = 0/*default*/;
  const markRanges: MarkRange[] = [/*default empty*/];

  ranges.forEach(({ $from, $to }) => {
    const from = $from.pos;
    const to = $to.pos;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if(!node.isText && !node.marks.length) return/*nothing to do*/;

      const relativeFrom = Math.max(from, pos);
      const relativeTo = Math.min(to, pos + node.nodeSize);
      const range = relativeTo - relativeFrom;
      selectionRange += range;

      markRanges.push(...node.marks.map(mark => ({ mark, from: relativeFrom, to: relativeTo })));
    });
  });
  if(selectionRange === 0/*default*/) return false/*no selected Range*/;

  const matchedMarkRange = markRanges
    .filter(markRange => markRange.mark.type.name === markName)
    .filter(markRange => objectIncludes(markRange.mark.attrs, attributes))
    .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0/*initial*/);

  // compute Range of Marks that exclude the looked-for Mark
  const excludedRange = markRanges
    .filter(markRange => markRange.mark.type.name !== markName && markRange.mark.type.excludes(state.schema.marks[markName]))
    .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0/*initial*/);

  // only include excludedRange if there was a match
  let range = matchedMarkRange/*default*/;
  if(matchedMarkRange > 0) {
    range += excludedRange;
  } /* else -- there was no match */

  return range >= selectionRange;
};

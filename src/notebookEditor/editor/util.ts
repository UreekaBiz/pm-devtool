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

// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/helpers/isNodeActive.ts
/**
 * check if a Node of the given {@link NodeName} is
 * currently present in the given {@link EditorState}'s Selection
 */
export const isNodeActive = (state: EditorState, nodeName: NodeName, attributes: Attributes): boolean => {
  const { from, to, empty } = state.selection,
        nodesWithRange: { node: ProseMirrorNode; from: number; to: number; }[] = [/*default empty*/];

  state.doc.nodesBetween(from, to, (node, pos) => {
    if(node.isText) return/*nothing to do*/;
    const nodeRangeFrom = Math.max(from, pos),
          nodeRangeTo = Math.min(to, pos + node.nodeSize);

    nodesWithRange.push({ node, from: nodeRangeFrom, to: nodeRangeTo });
  });

  const selectionRange = to - from;
  const matchedNodesWithRange = nodesWithRange
    .filter(nodeWithRange => nodeName === nodeWithRange.node.type.name)
    .filter(nodeWithRange => objectIncludes(nodeWithRange.node.attrs, attributes));
  if(empty) return !!matchedNodesWithRange.length/*no matched nodes*/;

  const finalRange = matchedNodesWithRange.reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0/*initial*/);
  return finalRange >= selectionRange;
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

// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/helpers/isMarkActive.ts
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
    const from = $from.pos,
          to = $to.pos;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if(!node.isText && !node.marks.length) return/*nothing to do*/;

      const markRangeFrom = Math.max(from, pos),
            markRangeTo = Math.min(to, pos + node.nodeSize),
            markRange = markRangeTo - markRangeFrom;
      selectionRange += markRange;
      markRanges.push(...node.marks.map(mark => ({ mark, from: markRangeFrom, to: markRangeTo })));
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

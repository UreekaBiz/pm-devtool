import { Mark as ProseMirrorMark, MarkType, Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';

import { EditorState, SelectionRange as ProseMirrorSelectionRange } from 'prosemirror-state';

import { objectIncludes } from '../../util';
import { Attributes, AttributeType, AttributeValue } from '../attribute';
import { SelectionRange } from '../command';
import { MarkName, MarkRange } from './type';

// ********************************************************************************
// == Getter ======================================================================
/** gets the given Mark from the given Node */
export const getMarkFromNode = (node: ProseMirrorNode, markName: MarkName) => node.marks.find(mark => mark.type.name === markName);

/** gets the value of the Mark from the given Node */
export const getMarkValue = (node: ProseMirrorNode, markName: MarkName, attributeType: AttributeType): AttributeValue | undefined => {
  const mark = getMarkFromNode(node, markName),
        value = mark ? mark.attrs[attributeType] : undefined;
  return value;
};

/** returns a string with the names of all allowed Marks for a Node  */
export const getAllowedMarks = (allowedMarks: MarkName[]) => allowedMarks.join(' ');

// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/helpers/getMarkRange.ts
/** Get the Range covered by a Mark */
export const getRangeCoveredByMark =($pos: ResolvedPos, markType: MarkType, markAttributes: Record<AttributeType | string, any> = {/*default no attributes*/}) => {
  let $childStart = $pos.parent.childAfter($pos.parentOffset);
  if($pos.parentOffset === $childStart.offset && $childStart.offset !== 0/*not at the direct start of the Node*/) {
    $childStart = $pos.parent.childBefore($pos.parentOffset);
  }/* else -- parentOffset different than start offset, or start offset right at the start of the Node*/
  if(!$childStart.node) return/*there is a direct child after the parentOffset*/;

  const mark = $childStart.node.marks.find(mark => mark.type === markType && objectIncludes(mark.attrs, markAttributes));
  if(!mark) return/*no Mark to compute a Range*/;

  let startIndex = $childStart.index,
      startPos = $pos.start() + $childStart.offset;
  let endIndex = startIndex + 1/*past it*/,
      endPos = startPos + $childStart.node.nodeSize;

  // compute the positions backwards and forwards
  // from the children at startIndex and endIndex
  while(startIndex > 0/*haven't reached parent, going backwards*/ && mark.isInSet($pos.parent.child(startIndex - 1/*child at previous index*/).marks)) {
    startIndex -= 1/*go backwards to parent*/;
    startPos -= $pos.parent.child(startIndex).nodeSize;
  }
  while(endIndex < $pos.parent.childCount/*haven't reached parent end going forwards*/ && isSameMarkInArray($pos.parent.child(endIndex).marks, markType, markAttributes)) {
    endPos += $pos.parent.child(endIndex).nodeSize;
    endIndex += 1/*move forwards, away from parent*/;
  }

  return { from: startPos, to: endPos };
};

/**
 * look for Marks across current Selection and return the attributes of the Mark
 * that matches the given {@link MarkName} if it is found
 */
export const getMarkAttributes = (state: EditorState, markName: MarkName): Record<AttributeType | string, any> => {
const markType = state.schema.marks[markName];
const { from, to, empty } = state.selection;

const marks: ProseMirrorMark[] = [];
if(empty) {
  if(state.storedMarks) {
    marks.push(...state.storedMarks);
  } /* else -- there are no stored Marks */

  // add Marks at the $anchor if any.
  // The empty check above guarantees that $anchor and $head are the same
  marks.push(...state.selection.$anchor.marks());
} else {
  state.doc.nodesBetween(from, to, node => { marks.push(...node.marks); });
}

const mark = marks.find(markItem => markItem.type.name === markType.name);
if(!mark) {
  return {/*no attributes by definition*/};
} /* else -- there is a Mark present in the Selection, return its attributes */

return { ...mark.attrs };
};

// == Validation ==================================================================
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/helpers/isMarkActive.ts
/**
 * check if a Node of the given {@link NodeName} is
 * currently present in the given {@link EditorState}'s Selection
 */
 export const isMarkActive = (state: EditorState, markName: MarkName, attributes: Attributes = {/*default no attrs*/}): boolean => {
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
  let finalRange = matchedMarkRange/*default*/;
  if(matchedMarkRange > 0) {
    finalRange += excludedRange;
  } /* else -- there was no match */

  return finalRange >= selectionRange;
};

/**
 * check if the given MarkType can be applied through
 * the given {@link SelectionRange}s
 * */
export const doesMarkApplyToRanges = (documentNode: ProseMirrorNode, selectionRanges: readonly ProseMirrorSelectionRange[], markType: MarkType) => {
  for(let rangeIndex=0; rangeIndex<selectionRanges.length; rangeIndex++) {
    const { $from, $to } = selectionRanges[rangeIndex];
    let canMarkBeApplied = false/*default*/;

    if($from.depth === 0/*Doc level depth*/) {
      canMarkBeApplied = documentNode.inlineContent && documentNode.type.allowsMarkType(markType);
    } /* else -- do not change default */

    documentNode.nodesBetween($from.pos, $to.pos, (node) => {
      if(canMarkBeApplied) {
        return false/*stop descending*/;
      } /* else -- check if Mark can be applied */

      canMarkBeApplied = node.inlineContent && node.type.allowsMarkType(markType);
      return true/*keep descending*/;
    });

    if(canMarkBeApplied) {
      return true/*can apply Mark for Nodes in Range*/;
    } /* else -- return false */
  }

  return false/*cannot apply Mark for Nodes in Range*/;
};

// == Search ======================================================================
/**
 * get the Marks that exist in the given range of the given
 * Document {@link ProseMirrorNode}
 */
export const getMarksInRange = (doc: ProseMirrorNode, selectionRange: SelectionRange) => {
  const { from, to } = selectionRange,
        marksBetween: MarkRange[] = [/*default empty*/];

  if(from === to) {
    const marks = doc.resolve(from).marks();
    for(let i=0; i<marks.length; i++) {
      const mark = marks[i],
            $pos = doc.resolve(from - 1),
            markRange = getRangeCoveredByMark($pos, mark.type);
      if(!markRange) continue/*Mark does not span any range*/;
      marksBetween.push({ mark, ...markRange });
    }
  } else {
    doc.nodesBetween(from, to, (node, pos) => { marksBetween.push(...node.marks.map(mark => ({ from: pos, to: pos + node.nodeSize, mark }))); });
  }

  return marksBetween;
};

/**
 * Check if any Marks in the given {@link ProseMirrorMark} array have the same
 * {@link MarkType} as the given one, as well as the same set of attributes, and
 * return the Mark that matches
 */
export const findSameMarkInArray = (marks: readonly ProseMirrorMark[], markType: MarkType, attributes: Record<AttributeType | string, any> = {/*default empty*/}) =>
  marks.find(mark => mark.type === markType && objectIncludes(mark.attrs, attributes));

/**
 * Check if any of the Marks in the given {@link ProseMirrorMark} array are of the
 * same type as the given {@link MarkType} and have the same attributes
 */
export const isSameMarkInArray = (marks: readonly ProseMirrorMark[], markType: MarkType, markAttributes: Record<AttributeType | string, any> = {/*default empty*/}) => !!findSameMarkInArray(marks, markType, markAttributes);

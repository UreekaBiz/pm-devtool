import { Node as ProseMirrorNode } from 'prosemirror-model';
import { AllSelection, EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';

import { CellSelection } from './extension/table/class';

// ********************************************************************************
// == Type ========================================================================
// .. Selection ...................................................................
// the depth of the selection from the current Node:
// * 0 is the base Node
// * `selection.depth` is the parent Node
export type SelectionDepth = number | undefined/*current Node*/;

/** the depth of an ancestor Node */
export enum AncestorDepth {
  Document = 0,
  GrandParent = -1,
  GreatGrandParent = -2,
  GreatGreatGrandParent = -3,
}

// .. Position ....................................................................
// type of the function that is used to compute the position of a NodeView in the
// current Document
export type getPosType = boolean | (() => number);

// ................................................................................
/** Checks to see whether an object is a getPos function */
export const isGetPos = (object: any): object is (() => number) => typeof object === 'function';

/** Type guard that defines if a {@link Selection} is a {@link AllSelection} */
export const isAllSelection = (selection: Selection): selection is AllSelection  => selection instanceof AllSelection;

/** Type guard that defines if a {@link Selection} is a {@link CellSelection} */
export const isCellSelection = (selection: Selection): selection is CellSelection => selection.toJSON().type === 'cell';

/** Type guard that defines if a {@link Selection} is a {@link TextSelection} */
export const isTextSelection = (selection: Selection): selection is TextSelection  => selection.toJSON().type === 'text';

/** Type guard that defines if a {@link Selection} is a {@link NodeSelection} */
export const isNodeSelection = (selection: Selection): selection is NodeSelection => 'node' in selection;

/** Checks whether the given {@link Selection} is of GapCursor type */
export const isGapCursorSelection = (selection: Selection) => selection.toJSON().type === 'gapcursor';

// == Node ========================================================================
/**
 * @returns currently selected Node. The Node selection is based on the depth of
 *           the selection */
 export const getSelectedNode = (state: EditorState, depth?: SelectionDepth) => {
  // if depth is provided then an ancestor is returned
  const { selection } = state;
  if(depth !== undefined) return selection.$anchor.node(depth);

  // gets the selected Node based on its position
  const selectedNode = isNodeSelection(selection) ? selection.node : undefined/*no node selected*/;
  return selectedNode;
};

export const getEndOfDocPosition = (doc: ProseMirrorNode) =>
  doc.nodeSize - 2/*account for start and end of Doc*/;

/** Gets all the ascendants of the current selected Node */
 export const getAllAscendantsFromSelection = (state: EditorState): (ProseMirrorNode | null | undefined)[] => {
  const { selection } = state;
  const { $anchor } = selection;

  const selectedNode = getSelectedNode(state);
  const ascendants = [selectedNode];

  // decreasing order of depth
  for(let i=$anchor.depth; i>= 0;i--) {
    const ascendant = $anchor.node(i);
    ascendants.push(ascendant);
  }

  return ascendants;
};

// == Range =======================================================================
/**
 * computes the Range that holds all Nodes in between the start and end of the
 * Blocks located at the anchor and head of the given {@link Selection}
 */
export const getBlockNodeRange = (selection: Selection) => ({
  from: selection.from - selection.$from.parentOffset,
  to: (selection.to - selection.$to.parentOffset) + selection.$to.parent.nodeSize - 2/*account for the start and end of the parent Node*/,
});

/** check if the Selection currently spans all the content of the current Block */
export const isAllBlockNodeRangeSelected = (selection: Selection) => {
  const { from: currentFrom, to: currentTo } = selection,
        { from: blockRangeFrom, to: blockRangeTo } = getBlockNodeRange(selection);
  if(currentFrom === blockRangeFrom && currentTo === blockRangeTo) return true/*range inside Block is selected */;

  return false/*not range inside Block is selected*/;
};

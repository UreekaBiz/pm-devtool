import { Fragment, Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';
import { EditorState, Selection, Transaction } from 'prosemirror-state';

import { objectIncludes } from '../../util';
import { Attributes, AttributeType } from '../attribute';
import { DocumentNodeType } from '../extension/document';
import { mapOldStartAndOldEndThroughHistory } from '../step';
import { getNodeName, NodeIdentifier, NodeName } from './type';
import { SelectionRange } from '../command/selection';

// ********************************************************************************
// == Manipulation ================================================================
/** @returns the parent node of a {@link Selection} */
export const getParentNode = (selection: Selection): ProseMirrorNode => selection.$anchor.parent;

// -- Search ----------------------------------------------------------------------
export type NodePosition = Readonly<{ node: ProseMirrorNode; position: number; }>;

/** @returns the first Node (as a {@link NodePosition}) with the specified identifier */
export const findNodeById = (document: DocumentNodeType, nodeId: NodeIdentifier): NodePosition | null/*not found*/ => {
  let nodeFound: NodePosition | null/*not found*/ = null/*not found*/;
  document.descendants((node, position) => {
    if(nodeFound) return false/*don't bother to descend since already found*/;
    if(node.attrs[AttributeType.Id] !== nodeId) return true/*not a match but descendants might be so descend*/;

    nodeFound = { node, position };
    return false/*don't bother to descend since already found*/;
  });
  return nodeFound;
};

// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/helpers/findParentNodeClosestToPos.ts
/**
 * look for the closest parent Node that matches the given {@link Predicate}
 * and return a {@link FindParentNodeClosestToPosReturnType} object
 * with information about the found Node
 */
type NodePredicate = (node: ProseMirrorNode, depth: number) => boolean;
type FindParentNodeClosestToPosReturnObjType = { pos: number; start: number; depth: number; node: ProseMirrorNode; } | undefined
export const findParentNodeClosestToPos = ($pos: ResolvedPos, predicate: NodePredicate): FindParentNodeClosestToPosReturnObjType => {
  for(let depth = $pos.depth; depth > 0; depth--) {
    const nodeAtDepth = $pos.node(depth);
    if(predicate(nodeAtDepth, depth)) {
      return { pos: $pos.before(depth), start: $pos.start(depth), depth, node: nodeAtDepth };
    } /* else -- ignore Node */
  }

  return/*default undefined*/;
};

/**
 * return an array of {@link ProseMirrorNode}s that match the given predicate
 * and are present in the given {@link SelectionRange}
 */
export const findChildrenInRange = (node: ProseMirrorNode, range: SelectionRange, predicate: (node: ProseMirrorNode) => boolean): NodePosition[] => {
  const nodesWithPos: NodePosition[] = [/*default empty*/];

  node.nodesBetween(range.from, range.to, (child, position) => {
    if(predicate(child)) {
      nodesWithPos.push({ node: child, position });
    } /* else -- predicate does not match, do not include */
  });

  return nodesWithPos;
};

// ................................................................................
/**
 * @param node1 The first {@link ProseMirrorNode} whose content will be compared
 * @param node2 The second {@link ProseMirrorNode} whose content will be compared
 * @returns The position at which the differences between the contents of the two
 *          Nodes start, and the object that contains the positions at which the
 *          differences between the contents of the two nodes end. Since the end
 *          position may not be the same in both Nodes, an object with the two
 *          positions is returned. If the content of the two Nodes is the same,
 *          undefined is returned
 */
 export const findContentDifferencePositions = (node1: ProseMirrorNode, node2: ProseMirrorNode) => {
  const docsDifferenceStart = node1.content.findDiffStart(node2.content),
        docDifferenceEnds = node1.content.findDiffEnd(node2.content);

  if(!docsDifferenceStart && docsDifferenceStart !== 0/*is a valid doc position*/) return;
  if(!docDifferenceEnds) return;

  return { docsDifferenceStart, docDifferenceEnds };
};

export const getNodesAffectedByTransaction = (transaction: Transaction, nodeNames?: Set<NodeName>): NodePosition[] => {
  const { maps } = transaction.mapping;
  let affectedNodes: NodePosition[] = [];

  for(let i=0; i<maps.length; i++) {
    maps[i].forEach((start, end) => {
      const { newNodePositions } = getNodesAffectedByStepMap(transaction, i, start, end, nodeNames);
      affectedNodes = [...affectedNodes, ...newNodePositions];
    });
  }

  return affectedNodes;
};

/**
 * @param transaction The transaction whose stepMaps will be looked through
 * @param nodeNameSet The set of nodeNames that will be looked for deletions in
 *        the Transaction's stepMaps. If not provided all nodes will be considered
 * @returns an array of {@link NodePosition} with the Nodes of the specified types
 *          that were deleted by the Transaction if any
 */
 export const getNodesRemovedByTransaction = (transaction: Transaction, nodeNameSet?: Set<NodeName>) => {
  const { maps } = transaction.mapping;
  let nodePositions: NodePosition[] = [/*empty by default*/];
  // NOTE: since certain operations (e.g. dragging and dropping a Node) occur
  //       throughout more than one stepMapIndex, returning as soon as possible
  //       from this method can lead to incorrect behavior (e.g. the dragged Node's
  //       nodeView being deleted before the next stepMap adds it back). For this
  //       reason the removed Nodes are computed on each stepMap and the final
  //       nodePositions array is what is returned
  // NOTE: this is true for this method specifically given its intent (checking to
  //       see if Nodes of a specific type got deleted), and does not mean that
  //       other extensions or plugins that use similar functionality to see if
  //       Nodes got deleted or added cannot return early, as this will depend on
  //       their specific intent
  for(let stepMapIndex=0; stepMapIndex < maps.length; stepMapIndex++) {
    maps[stepMapIndex].forEach((unmappedOldStart, unmappedOldEnd) => {
      const { oldNodePositions, newNodePositions } = getNodesAffectedByStepMap(transaction, stepMapIndex, unmappedOldStart, unmappedOldEnd, nodeNameSet);
      nodePositions = computeRemovedNodePositions(oldNodePositions, newNodePositions);
    });
  }
  return nodePositions;
};

/** Get Node-Positions that are no longer present in the newArray */
export const computeRemovedNodePositions = (oldArray: NodePosition[], newArray: NodePosition[]) =>
  oldArray.filter(oldNodeObj => !newArray.some(newNodeObj => newNodeObj.node.attrs[AttributeType.Id] === oldNodeObj.node.attrs[AttributeType.Id]));

/**
 * @param transaction The transaction whose affected ranges are being computed
 * @param stepMapIndex The stepMapIndex of the corresponding stepMap of the Transaction
 * @param unmappedOldStart The default oldStart of the stepMap of the Transaction
 * @param unmappedOldEnd The default oldEnd of the stepMap of the Transaction.
 * @param nodeNames The names of the Nodes that are being looked for in the affected
 *                  range. If not provided all nodes are considered.
 * @returns The Nodes of the specified types that existed in the affected range
 *          of the Transaction before the steps were applied, and the Nodes of the
 *          specified types that exist after the Steps have been applied
 */
// NOTE: separated into its own method since all logic that needs to check whether
//       some node was deleted in a transaction uses this approach
export const getNodesAffectedByStepMap = (transaction: Transaction, stepMapIndex: number, unmappedOldStart: number, unmappedOldEnd: number, nodeNames?: Set<NodeName>) => {
  // map to get the oldStart, oldEnd that account for history
  const { mappedOldStart, mappedOldEnd, mappedNewStart, mappedNewEnd } = mapOldStartAndOldEndThroughHistory(transaction, stepMapIndex, unmappedOldStart, unmappedOldEnd);

  const oldNodePositions = getNodesBetween(transaction.before, mappedOldStart, mappedOldEnd, nodeNames),
        newNodePositions = getNodesBetween(transaction.doc, mappedNewStart, mappedNewEnd, nodeNames);

  return { oldNodePositions, newNodePositions };
};

// Creates and returns an array of {@link NodePosition}s by looking at the Nodes between
// {@link #from} and {@link #to} in the given {@link #rootNode}, adding those Nodes
// whose type name is included in the given {@link #nodeNames} set. Very similar to
// doc.nodesBetween, but specifically for {@link NodePosition} objects.
const getNodesBetween = (rootNode: ProseMirrorNode, from: number, to: number, nodeNames?: Set<NodeName>) => {
  const nodesOfType: NodePosition[] = [];
  rootNode.nodesBetween(from, to, (node, position) => {
    const nodeName = getNodeName(node);
    if(nodeNames === undefined/*not provided -- all nodes considered*/ || nodeNames.has(nodeName)) {
      nodesOfType.push({ node, position });
    } /* else -- ignore Node */
  });

  return nodesOfType;
};

// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/helpers/isNodeActive.ts
/**
 * check if a Node of the given {@link NodeName} is
 * currently present in the given {@link EditorState}'s Selection
 */
 export const isNodeActive = (state: EditorState, nodeName: NodeName, attributes: Attributes = {/*default no attrs*/}): boolean => {
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

/** check if a Node has no content */
export const isNodeEmpty = (node: ProseMirrorNode) => !node.content.size;

// -- Creation --------------------------------------------------------------------
/** Creates a {@link Fragment} with the content of the input Node plus the given {@link appendedNode} */
export const createFragmentWithAppendedContent = (node: ProseMirrorNode, appendedNode: ProseMirrorNode) =>
  node.content.append(Fragment.from(appendedNode));

// -- Transaction -----------------------------------------------------------------
/**
 * @param transaction The transaction that will be checked
 * @param nodeNameSet The set of node names that will be looked for in the
 *        {@link NodePosition} array of Nodes affected by the Transaction's stepMaps
 * @returns `true` if any of the stepMaps in the Transaction modified Nodes whose
 *          type name is included in the given nodeNameSet. `false` otherwise
 */
export const wereNodesAffectedByTransaction = (transaction: Transaction, nodeNameSet: Set<NodeName>) => {
  const { maps } = transaction.mapping;
  for(let stepMapIndex = 0; stepMapIndex < maps.length; stepMapIndex++) {
    let nodesOfTypeAffected = false/*default*/;

    // NOTE: unfortunately StepMap does not expose an array interface so that a
    //       for-loop-break construct could be used here for performance reasons
    maps[stepMapIndex].forEach((unmappedOldStart, unmappedOldEnd) => {
      if(nodesOfTypeAffected) return/*already know nodes were affected*/;

      const { oldNodePositions, newNodePositions } = getNodesAffectedByStepMap(transaction, stepMapIndex, unmappedOldStart, unmappedOldEnd, nodeNameSet);
      const oldNodesAffected = nodeFoundArrayContainsNodesOfType(oldNodePositions, nodeNameSet),
            newNodesAffected = nodeFoundArrayContainsNodesOfType(newNodePositions, nodeNameSet);

      if((oldNodesAffected || newNodesAffected)) {
        nodesOfTypeAffected = true;
        return;
      } /* else -- keep checking if nodes were affected*/
    });

    if(nodesOfTypeAffected) return true/*nodes were affected*/;
  }

  return false/*nodes were not affected*/;
};
const nodeFoundArrayContainsNodesOfType = (nodeObjs: NodePosition[], nodeNameSet: Set<NodeName>) =>
  nodeObjs.some(({ node }) => nodeNameSet.has(node.type.name as NodeName/*by definition*/));

import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';

import { camelToTitleCase, isCellSelection, MarkName, NodeName, SelectionDepth } from 'common';

import { EditorToolComponentProps, Toolbar, ToolItem } from '../type';
import { TEXT_BLOCK_TOOL_ITEMS, BLOCK_TOOL_ITEMS, NODE_CREATION_TOOL_ITEMS } from './toolItem';
import { UNIQUE_TOOL_ITEMS } from './uniqueToolItem';

// ********************************************************************************
// == Node ========================================================================
/** get a {@link Toolbar} for the given {@link ProseMirrorNode} */
export const buildNodeToolbar = (node: ProseMirrorNode, depth: SelectionDepth, selection: Selection): Toolbar => {
  const { toolCollections, rightContent } = buildNodeToolCollections(node, depth, selection);

  return {
    title: camelToTitleCase(node.type.name),
    name: node.type.name as MarkName/*by definition*/,
    toolsCollections: toolCollections,
    rightContent,
  };
};

/**
 * build {@link Toolbar} for the given {@link ProseMirrorNode}
 * based on its characteristics
 */
const buildNodeToolCollections = (node: ProseMirrorNode, depth: SelectionDepth, selection: Selection): { toolCollections: ToolItem[][]; rightContent: React.FC<EditorToolComponentProps> | undefined/*not required by Toolbar*/;  } => {
  const toolCollections: ToolItem[][] = [];
  let rightContent = undefined/*default*/;

  if(WRAPPER_NODES.includes(node.type.name as NodeName/*by definition*/)) {
    return { toolCollections, rightContent };
  } /* else -- not a Wrapper Node */

  const negativeDepthChecker = NODES_WITH_SPECIFIC_NEGATIVE_DEPTH[node.type.name as NodeName/*by definition*/];
  if(negativeDepthChecker) {
    const negativeDepth = negativeDepthChecker(selection);
    if(depth !== (selection.$anchor.depth - Math.abs(negativeDepth))) {
      return { toolCollections, rightContent };
    } /* else -- Node is allowed to show toolItems at this depth*/
  } /* else -- Node has no specific negative depth checks */

  if(node.isTextblock && TEXT_BLOCK_TOOL_ITEMS.length > 0) {
    toolCollections.push(TEXT_BLOCK_TOOL_ITEMS);
  } /* else -- not a TextBlock or no TextBlock ToolItems */

  if(node.isBlock && BLOCK_TOOL_ITEMS.length > 0) {
    toolCollections.push(BLOCK_TOOL_ITEMS);
  } /* else -- not a Block or no Block ToolItems */

  if(!node.type.spec.topNode/*do not add to Document*/ && NODE_CREATION_TOOL_ITEMS.length > 0) {
    toolCollections.push(NODE_CREATION_TOOL_ITEMS);
  } /* else -- no Node Creation ToolItems */

  const uniqueToolItemsObj = UNIQUE_TOOL_ITEMS[node.type.name as NodeName];
  if(uniqueToolItemsObj && uniqueToolItemsObj.items.length > 0) {
    const { position } = uniqueToolItemsObj;
    position === 'start' ? toolCollections.unshift(uniqueToolItemsObj.items) : toolCollections.push(uniqueToolItemsObj.items);
  } /* else -- no unique tool items for this Node or the ToolItems entry is empty */

  if(uniqueToolItemsObj.rightContent) {
    rightContent = uniqueToolItemsObj.rightContent;
  } /* else -- Toolbar does not require right content */

  return { toolCollections, rightContent };
};

// --------------------------------------------------------------------------------
/**
 * Nodes whose only purpose is to wrap other Nodes, and hence should
 * not display any ToolItems in the Toolbar
 */
const WRAPPER_NODES: NodeName[] = [
  NodeName.ROW,
];

/**
 * Nodes that should only display ToolItems when the SelectionDepth equals
 * $anchor.depth minus the number returned from the function
 * specified in this Record
 */
const NODES_WITH_SPECIFIC_NEGATIVE_DEPTH: Partial<Record<NodeName, (selection: Selection) => number>> = {
  // for Nodes inside Tables, the expected order is SelectionDepth - 1 = Cell,
  // SelectionDepth - 2 = Row, SelectionDepth - 3 = Table

  // NOTE: the depth decreases in 1 since a CellSelection starts from the
  //       anchor of the Cell, and not the content inside it
  [NodeName.CELL]: (selection) => isCellSelection(selection) ? 0 : -1,
  [NodeName.HEADER_CELL]: (selection) => isCellSelection(selection) ? 0 : -1,
  [NodeName.TABLE]: (selection) => isCellSelection(selection) ? -2 : -3,
};

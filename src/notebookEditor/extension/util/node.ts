import { CommandProps, Editor } from '@tiptap/core';
import { GapCursor } from 'prosemirror-gapcursor';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, NodeSelection, Selection, Transaction } from 'prosemirror-state';

import {  getNodeOffset, NodeName, NotebookSchemaType } from 'common';

import { ExtensionName, SelectionDepth } from 'notebookEditor/model/type';

// ********************************************************************************
// == Toggle ======================================================================
/**
 * Toggles a block node if its currently active, or focuses it back if the type of
 * the current selection is 'gapCursor'
 */
export const toggleBlockNode = (props: CommandProps, nodeName: NodeName) => {
  if(props.editor.isActive(nodeName)) return props.commands.clearNodes();
  /* else -- insert node */

  const { selection } = props.view.state,
    prevPos = selection.$anchor.pos;

  if(selection.toJSON().type === ExtensionName.GAP_CURSOR) return props.chain().focus().setTextSelection(prevPos).run();

  return props.chain().setNode(nodeName).setTextSelection(prevPos).run();
};

// -- Backspace --------------------------------------------------------------------
/** Ensures the a node block is deleted on backspace if its empty */
export const handleBlockBackspace = (editor: Editor, nodeName: NodeName) => {
  const { empty, $anchor } = editor.state.selection;
  const isAtStart = $anchor.pos === 1/*first position inside the node*/;

  if(!empty || $anchor.parent.type.name !== nodeName) return false;
  if(isAtStart || !$anchor.parent.textContent.length) return editor.commands.clearNodes();

  return false;
};

// -- Cursor Behavior -------------------------------------------------------------
/** Ensures correct arrow up behavior when inside a block node with text content */
export const handleBlockArrowUp = (editor: Editor, nodeName: NodeName) => {
  const { view, state } = editor,
        { selection, tr } = state,
        { dispatch } = view;

  if(selection.$anchor.parent.type.name !== nodeName) return false;

  const isAtStart = selection.$anchor.pos === 1/*at the start of the doc*/;
  if(!isAtStart) return false;

  tr.setSelection(new GapCursor(tr.doc.resolve(0/*at the start of the doc*/)));
  dispatch(tr);
  return true;
};

/** Ensures correct arrow down behavior when inside a block node with text content */
export const handleBlockArrowDown = (editor: Editor, nodeName: NodeName) => {
  const { view, state } = editor,
        { doc, selection, tr } = state,
        { dispatch } = view;

  if(selection.toJSON().type === ExtensionName.GAP_CURSOR && (selection.$anchor.pos !== 0)) return true;
  if(selection.$anchor.parent.type.name !== nodeName) return false;

  const isAtEnd = selection.$anchor.pos === doc.nodeSize - 3/*past the node, including the doc tag*/;
  if(!isAtEnd) return false;

  tr.setSelection(new GapCursor(tr.doc.resolve(doc.nodeSize - 2/*past the node*/)));
  dispatch(tr);
  return true;
};

// == Position ====================================================================
// Type of the function that is used to compute the position of a NodeView in the
// current document
export type getPosType = boolean | (() => number);

/** Checks to see whether an object is a getPos function */
export const isGetPos = (object: any): object is (() => number) => typeof object === 'function';

/** gets the node before the current {@link Selection}'s anchor */
const getNodeBefore = (selection: Selection) => {
  const { nodeBefore } = selection.$anchor;
  return nodeBefore;
};

// == Selection ===================================================================
// -- Type ------------------------------------------------------------------------
/** type guard that defines if a {@link Selection} is a {@link NodeSelection} */
export const isNodeSelection = (selection: Selection<NotebookSchemaType>): selection is NodeSelection<NotebookSchemaType> => 'node' in selection;

/** Checks to see whether a {@link NodeSelection}'s node is of the given {@link type} */
export const selectionIsOfType = (selection: Selection<NotebookSchemaType>, type: string): selection is NodeSelection<NotebookSchemaType> =>
  isNodeSelection(selection) && selection.node.type.name === type;

// --------------------------------------------------------------------------------
/**
 * Gets currently selected node. The node selection is based on the depth of the
 * selection
 */
 export const getSelectedNode = (state: EditorState, depth?: SelectionDepth) => {
  const { selection } = state;

  // if depth is provided then an ancestor is returned
  if(depth !== undefined) return selection.$anchor.node(depth);
  // else -- is not ancestor

  // Gets the selected node based on its position
  const selectedNode = isNodeSelection(selection) ? selection.node : undefined/*no node selected*/;
  return selectedNode;
};

export const isFullySelected = (state: EditorState, node: ProseMirrorNode, pos: number): boolean => {
  const { selection } = state;
  const start = selection.$from.pos,
        end = selection.$to.pos;

  // the selection fully contains the node
  return pos >= start - 1 && end > pos + node.content.size;
};

/** gets all the ascendants of the current selected node. */
 export const getAllAscendantsFromSelection = (state: EditorState): (ProseMirrorNode | null | undefined)[] => {
  const { selection } = state;
  const { $anchor } = selection;

  const selectedNode = getSelectedNode(state);
  const ascendants = [selectedNode];

  // Decreasing order of depth
  for(let i=$anchor.depth; i>= 0;i--){
    const ascendant = $anchor.node(i);
    ascendants.push(ascendant);
  }

  return ascendants;
};

// --------------------------------------------------------------------------------
/**
 * Determines the new {@link Selection} given the current selection state of the
 * given {@link Transaction}
 *
 * @param selection The {@link Selection} that will be resolved
 * @param tr The {@link Transaction} whose document will be used to resolve the newSelection
 * @returns The new {@link Selection} that will be used after the transaction performs its modifications
 */
export enum SelectionBias {
  LEFT = -1,
  RIGHT = 1
}
export const resolveNewSelection = (selection: Selection<NotebookSchemaType>, tr: Transaction<NotebookSchemaType>, bias?: SelectionBias) => {
  let nodeSelection = false;
  if(isNodeSelection(selection)) nodeSelection = true;

  if(nodeSelection) return new NodeSelection(tr.doc.resolve(selection.$anchor.pos));
  /* else -- textSelection */

  return Selection.near(tr.doc.resolve(selection.$anchor.pos), bias ? bias : SelectionBias.LEFT/*default*/);
};

// ................................................................................
/** Returns the {@link ResolvedPos} of the anchor of the selection of the given {@link Transaction} */
export const getResolvedAnchorPos = (tr: Transaction<NotebookSchemaType>, extraOffset: number) => {
  const nodeBefore = getNodeBefore(tr.selection),
        nodeBeforeSize = nodeBefore?.nodeSize ?? 0/*no node before -- no size*/;

  const resolvedPos = tr.doc.resolve((tr.selection.anchor + extraOffset) - nodeBeforeSize);
  return resolvedPos;
};

/** Returns the {@link ResolvedPos} of the node that is parent of the current {@link NodeSelection}'s node */
export const getResolvedParentSelectionByAnchorOffset = (selection: NodeSelection, tr: Transaction) => {
  const nodeOffset = getNodeOffset(selection.$anchor.parent, selection.node);
  const resolvedPos = tr.doc.resolve(selection.$anchor.pos - nodeOffset);
  return new NodeSelection<NotebookSchemaType>(resolvedPos);
};

// ................................................................................
/**
 * Replaces the node at the {@link Selection} of the given {@link Transaction} and
 * selects the new, replaced node
 */
export const replaceAndSelectNode = (node: ProseMirrorNode<NotebookSchemaType>, tr: Transaction<NotebookSchemaType>, dispatch: ((args?: any) => any) | undefined) => {
  if(!dispatch) throw new Error('Dispatch function undefined when it should not');

  tr.replaceSelectionWith(node);

  const nodeBefore = getNodeBefore(tr.selection),
        nodeBeforeSize = nodeBefore?.nodeSize ?? 0/*no node before -- no size*/;
  const resolvedPos = tr.doc.resolve(tr.selection.anchor - nodeBeforeSize);
  tr.setSelection(new NodeSelection(resolvedPos));

  dispatch(tr);

  return true/*replaced*/;
};


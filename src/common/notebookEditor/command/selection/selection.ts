import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Command, EditorState, NodeSelection, Selection, TextSelection, Transaction } from 'prosemirror-state';

import { minFromMax } from '../../../util';
import { NodeName } from '../../node';
import { getBlockNodeRange } from '../../selection';
import { AbstractDocumentUpdate } from '../type';

// ********************************************************************************
// == Type ========================================================================
export type SelectionRange = { from: number; to: number; }

/** set a TextSelection given the Range */
export const setTextSelectionCommand = (selectionRange: SelectionRange): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SetTextSelectionDocumentUpdate(selectionRange), state, dispatch);
export class SetTextSelectionDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly selectionRange: SelectionRange) {/*nothing additional*/}

  // NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/commands/setTextSelection.ts
  /*
   * modify the given Transaction such that a TextSelection
   * is set across the given Range
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { doc } = editorState,
          { from, to } = this.selectionRange;

    const minPos = TextSelection.atStart(doc).from,
          maxPos = TextSelection.atEnd(doc).to;

    const resolvedFrom = minFromMax(from, minPos, maxPos),
          resolvedEnd = minFromMax(to, minPos, maxPos);

    const newTextSelection = TextSelection.create(doc, resolvedFrom, resolvedEnd);
    return tr.setSelection(newTextSelection);
  }
}

export const selectTextBlockStartOrEndCommand = (side: 'start' | 'end', nodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SelectTextBlockStartOrEndDocumentUpdate(side, nodeName), state, dispatch);
export class SelectTextBlockStartOrEndDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly side: 'start' | 'end', private readonly nodeName: NodeName) {/*nothing additional*/}

  /**
   * modify the given Transaction such that the Selection is set
   * at the start or end of the current TextBlock
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;

    const startOrEndPos = this.side === 'start' ? selection.$from : selection.$to;
    if((startOrEndPos.parent.type.name !== this.nodeName)) return false/*should not be handled by this Node*/;

    let depth = startOrEndPos.depth;
    while(startOrEndPos.node(depth).isInline) {
      if(!depth) return false/*reached 0, depth of the Doc*/;
      depth--;
    }
    if(!startOrEndPos.node(depth).isTextblock) return false/*highest depth available is not a TextBlock*/;

    tr.setSelection(TextSelection.create(editorState.doc, this.side === 'start' ? startOrEndPos.start(depth) : startOrEndPos.end(depth)));
    return tr/*updated*/;
  }
}

/** set a NodeSelection at the given position */
export const setNodeSelectionCommand = (nodePos: number): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SetNodeSelectionDocumentUpdate(nodePos), state, dispatch);
export class SetNodeSelectionDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly nodePos: number) {/*nothing additional*/}

  // NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/313b8b8d0af7059c420ffc96c9362f0f4acc2138/packages/core/src/commands/setNodeSelection.ts
  /*
   * modify the given Transaction such that a NodeSelection
   * is set at the given position
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { doc } = tr;
    return tr.setSelection(NodeSelection.create(doc, minFromMax(this.nodePos, 0/*Doc start*/, doc.content.size)));
  }
}

// ................................................................................
/** select the contents of the current parent Block Node */
export const selectBlockNodeContentCommand = (nodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SelectBlockNodeContentDocumentUpdate(nodeName), state, dispatch);
export class SelectBlockNodeContentDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly nodeName: NodeName) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that the contents of the current
   * parent Block Node are selected and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = tr;
    const { $from, empty } = selection;

    if(!empty) return false/*do not overwrite Selection*/;
    if(!$from.parent.isTextblock) return false/*not a valid Node*/;
    if($from.parent.type.name !== this.nodeName) return false/*do not handle inside this Node*/;
    if($from.parent.textContent.length < 1) return false/*nothing to Select*/;

    const { from, to } = getBlockNodeRange(tr.selection);
    if(tr.selection.from === from && tr.selection.to === to) return false/*already selected all inside this Block*/;

    tr.setSelection(TextSelection.create(tr.doc, from, to));
    return tr/*updated*/;
  }
}

// ................................................................................
/** return the Node before the current {@link Selection}'s anchor */
const getNodeBefore = (selection: Selection) => {
  const { nodeBefore } = selection.$anchor;
  return nodeBefore;
};

/**
 * Replaces the node at the {@link Selection} of the given {@link Transaction} and
 * selects the new, replaced Node
 */
export const replaceAndSelectNodeCommand = (node: ProseMirrorNode): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ReplaceAndSelectNodeDocumentUpdate(node), state, dispatch);
export class ReplaceAndSelectNodeDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly node: ProseMirrorNode) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that a Block Node is created
   * below the current Selection
   */
  public update(editorState: EditorState, tr: Transaction) {
    tr.replaceSelectionWith(this.node);

    const nodeBefore = getNodeBefore(tr.selection),
          nodeBeforeSize = nodeBefore?.nodeSize ?? 0/*no node before -- no size*/;

    const resolvedPos = tr.doc.resolve(tr.selection.anchor - nodeBeforeSize);
    return tr.setSelection(new NodeSelection(resolvedPos));
  }
}


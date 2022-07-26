import { GapCursor } from 'prosemirror-gapcursor';
import { ParseOptions } from 'prosemirror-model';
import { Command, EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { ReplaceStep, ReplaceAroundStep } from 'prosemirror-transform';

import { getIndexAtResolvedPos, isGapCursorSelection, AbstractDocumentUpdate, AncestorDepth, Attributes, CreateBlockNodeDocumentUpdate, JSONNode, NodeName, SelectionRange } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { SetParagraphDocumentUpdate } from 'notebookEditor/extension/paragraph/command';
import { createNodeFromContent, isFragment } from 'notebookEditor/extension/util';

import { applyDocumentUpdates } from '../update';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/8c6751f0c638effb22110b62b40a1632ea6867c9/packages/core/src/commands/insertContentAt.ts

// -- Insertion -------------------------------------------------------------------
type InsertContentAtOptions = {
  parseOptions?: ParseOptions;
  updateSelection?: boolean;
}
// NOTE: this Command is limited to Web since the content that gets inserted must
//       might be a string that gets parsed and converted into an HTMLElement
/** Insert the given content at the specified SelectionRange */
export const insertContentAtCommand = (selectionRange: SelectionRange, value: string | JSONNode | JSONNode[], options?: InsertContentAtOptions): Command =>
  (state, dispatch) => AbstractDocumentUpdate.execute(new InsertContentAtDocumentUpdate(selectionRange, value, options), state, dispatch);

export class InsertContentAtDocumentUpdate implements AbstractDocumentUpdate  {
  public constructor(private readonly selectionRange: SelectionRange, private readonly value: string | JSONNode | JSONNode[], private readonly options?: InsertContentAtOptions) {/*nothing additional*/}

  /**
   * modify the given Transaction such that the given content is inserted at
   * the specified SelectionRange and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const options = { parseOptions: {/*default none*/}, updateSelection: true, ...this.options };
    const content = createNodeFromContent(editorState.schema, this.value, { parseOptions: { preserveWhitespace: 'full', ...options.parseOptions } });

    // don’t dispatch an empty Fragment, prevent errors
    if(content.toString() === '<>') {
      return false/*invalid Fragment*/;
    } /* else -- valid Fragment */

    let isOnlyTextContent = false/*default*/,
        isOnlyBlockContent = false/*default*/;
    const nodes = isFragment(content) ? content : [content];
    nodes.forEach(node => {
      node.check()/*check content is valid*/;

      if(node.isText && node.marks.length === 0) {
        isOnlyTextContent = true;
      } /* else -- do not change default */

      if(node.isBlock) {
        isOnlyBlockContent = true;
      } /* else -- do not change default */
    });

    // check if wrapping Node can be replaced entirely
    let { from, to } = this.selectionRange;
    if(from === to && isOnlyBlockContent) {
      const { parent } = tr.doc.resolve(from);
      const isEmptyTextBlock = parent.isTextblock
        && !parent.type.spec.code
        && !parent.childCount;

      if(isEmptyTextBlock) {
        from -= 1;
        to += 1;
      }
    }

    if(isOnlyTextContent && typeof this.value === 'string'/*for sanity*/) {
      // NOTE: insertText ensures marks are kept
      tr.insertText(this.value, from, to);
    } else {
      tr.replaceWith(from, to, content);
    }

    if(options.updateSelection) {
      setTransactionSelectionToInsertionEnd(tr, tr.steps.length - 1, -1);
    } /* else -- do not update Selection */
    return tr/*updated*/;
  }
}
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-state/blob/4faf6a1dcf45747e6d7cefd7e934759f3fa5b0d0/src/selection.ts
/**
 * Set the Selection of a Transaction to the end of its
 * inserted Content, if it inserted Content
 */
const setTransactionSelectionToInsertionEnd = (tr: Transaction, startingStepLength: number, bias: number) => {
  const lastStepIndex = tr.steps.length - 1;
  if(lastStepIndex < startingStepLength) {
    return/*nothing to do*/;
  } /* else -- valid index */

  const lastStep = tr.steps[lastStepIndex];
  if(!(lastStep instanceof ReplaceStep || lastStep instanceof ReplaceAroundStep)) {
    return/*nothing tod o*/;
  } /* else -- last Step inserted or replaced Content*/

  // set end to the immediate newTo of the last Mapping
  const lastMap = tr.mapping.maps[lastStepIndex];
  let end = 0/*default*/;
  lastMap.forEach((from, to, newFrom, newTo) => end = newTo);

  tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
};

// -- Block Toggle ----------------------------------------------------------------
// NOTE: this Utility is located in web since it makes use of applyDocumentUpdates
// NOTE: this is a Utility and not a Command for the same reason as above
// NOTE: this Utility must make use of applyDocumentUpdates to ensure consistent
//       resulting Selection behavior when toggling Block Nodes
export const toggleBlock = (editor: Editor, blockNodeName: NodeName, blockAttrs: Partial<Attributes>) => {
  const { selection } = editor.view.state;
  if(!selection.empty) return false/*do not handle*/;

  const togglingBlock = selection.$anchor.parent.type.name === blockNodeName;
  if(togglingBlock) {
    return applyDocumentUpdates(editor, [new SetParagraphDocumentUpdate()/*default Block*/]);
  } /* else -- setting Block */

  return applyDocumentUpdates(editor, [new CreateBlockNodeDocumentUpdate(blockNodeName, blockAttrs)]);
};

// -- Block Backspace -------------------------------------------------------------
// NOTE: the following Block Commands must be located in web since
//       whenever they come from common or a similar place there are issues with
//       the GapCursor Selection or the state getting stuck
/** ensure the Block at the Selection is deleted on Backspace if its empty */
export const blockBackspaceCommand = (blockNodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new BlockBackspaceDocumentUpdate(blockNodeName), state, dispatch);
export class BlockBackspaceDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly blockNodeName: NodeName) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that the Block at the Selection
   * is deleted on Backspace if it is empty and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { empty, $from, from } = editorState.selection;
    if(!empty) return false/*let event be handled elsewhere*/;
    if($from.parent.type.name !== this.blockNodeName) return false/*call should not be handled by this Node*/;

    const isAtStartOfDoc = from === 1/*at the start of the Doc*/;
    if(isAtStartOfDoc || !$from.parent.textContent.length/*empty*/) {
      const { defaultType: defaultBlockType  } = $from.node(AncestorDepth.GrandParent).contentMatchAt(getIndexAtResolvedPos($from));
      if(!defaultBlockType) return false/*cannot replace with default block at this position*/;

      return tr.setBlockType($from.before(), $from.after(), defaultBlockType/*default Block*/);
    } /* else -- no need to delete blockNode */

    return false/*let Backspace event be handled elsewhere*/;
  }
}

/**
 * ensure the expected Mod-Backspace behavior is maintained inside
 * Block Nodes by removing a '\n' if required
 * */
 export const blockModBackspaceCommand = (blockNodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new BlockModBackspaceDocumentUpdate(blockNodeName), state, dispatch);
export class BlockModBackspaceDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly blockNodeName: NodeName) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that the expected Mod-Backspace behavior
   * is maintained inside Block Nodes, by removing a '\n' if
   * required, and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = tr;
    const { empty, $from, from } = selection;

    if(!empty || $from.parent.type.name !== this.blockNodeName) return false/*let event be handled elsewhere*/;

    const { parentOffset } = $from;
    if($from.parent.textContent.charAt(parentOffset-1/*account for start of parentNode*/) === '\n') {
      tr.setSelection(TextSelection.create(tr.doc, from, from-1/*remove the '\n'*/))
        .deleteSelection();

      return tr/*updated*/;
    } /* else -- */

    return false/*let event be handled elsewhere*/;
  }
}

// -- Block Selection -------------------------------------------------------------
/**
 * ensure correct arrow up behavior inside a Block Node by creating a new
 * {@link GapCursor} selection when the arrowUp key is pressed if the selection
 * is at the start of it
 */
 export const blockArrowUpCommand = (blockNodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new BlockArrowUpDocumentUpdate(blockNodeName), state, dispatch);
export class BlockArrowUpDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly blockNodeName: NodeName) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that the Selection becomes a
   * GapCursor Selection when the arrowUp key is pressed if the Selection
   * is at the start of it and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState,
          { $from, from } = selection;
    if($from.parent.type.name !== this.blockNodeName) return false/*call should not be handled by this Node*/;
    if(isGapCursorSelection(selection) && (from !== 0/*not the Doc*/)) return false/*selection already a GapCursor*/;

    const isAtStartOfDoc = selection.from === 1/*at the start of the doc*/,
          isAtStartOfBlock = from === $from.before()+1/*inside the Block, at its start*/;

    if(isAtStartOfDoc) {
      return tr.setSelection(new GapCursor(tr.doc.resolve(0/*at the start of the doc*/)));
    } else if(isAtStartOfBlock) {
      const nodeBeforeBlock = tr.doc.resolve($from.before()).nodeBefore;
      if(!nodeBeforeBlock) { return tr.setSelection(new GapCursor(tr.doc.resolve($from.before()))); }
      else { return tr.setSelection(Selection.near(tr.doc.resolve($from.before()), -1/*bias to the left*/)); }
    } /* else -- no need to set gapCursor */

    return false/*default*/;
  }
}

/**
 * ensure correct arrow up behavior inside a Block Node by creating a new
 * {@link GapCursor} selection when the arrowDown is pressed if the selection
 * is at the end of it
 */
export const blockArrowDownCommand = (blockNodeName: NodeName): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new BlockArrowDownDocumentUpdate(blockNodeName), state, dispatch);
export class BlockArrowDownDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly blockNodeName: NodeName) {/*nothing additional*/ }

  /*
   * modify the given Transaction such that the Selection becomes a
   * GapCursor Selection when the arrowDown key is pressed if the Selection
   * is at the start of it and return it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState,
          { $from, from } = selection;

    if($from.parent.type.name !== this.blockNodeName) return false/*call should not be handled by this Node*/;
    if(isGapCursorSelection(selection) && (from !== 0/*not the Doc*/)) return false/*selection already a GapCursor*/;

    const isAtEndOfDoc = from === editorState.doc.nodeSize - 3/*past the Node, including the doc tag*/,
          isAtEndOfBlock = from === $from.after()-1/*inside the Block, at its end*/;
    if(isAtEndOfDoc) {
      return tr.setSelection(new GapCursor(tr.doc.resolve(editorState.doc.nodeSize - 2/*past the Node*/)));
    } else if(isAtEndOfBlock) {
      const nodeAfterBlock = tr.doc.resolve($from.after()).nodeAfter;
      if(!nodeAfterBlock) { return tr.setSelection(new GapCursor(tr.doc.resolve($from.after()))); }
      else { return tr.setSelection(Selection.near(tr.doc.resolve($from.after()), 1/*bias to the right*/)); }
    } /* else -- no need to set gapCursor */

    return false/*default*/;
  }
}

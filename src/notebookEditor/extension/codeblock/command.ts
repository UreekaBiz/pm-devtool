import { GapCursor } from 'prosemirror-gapcursor';
import { Fragment } from 'prosemirror-model';
import { Command, EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { getCodeBlockNodeType, getParagraphNodeType, isCodeBlockNode, isNotNullOrUndefined, AbstractDocumentUpdate, AncestorDepth, AttributeType, CodeBlockLanguage } from 'common';

import { formatCodeBlockChild } from './language';

// ********************************************************************************
// == Selection ===================================================================
/** select all the content inside a CodeBlock */
export const selectAllInsideCodeBlockCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SelectAllInsideCodeBlockDocumentUpdate(), state, dispatch);
export class SelectAllInsideCodeBlockDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that all the content
   * inside a CodeBlock is selected
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = tr,
          { $from } = selection;
    const codeBlock = $from.node(AncestorDepth.GrandParent);
    if(!codeBlock || !isCodeBlockNode(codeBlock)) return false/*not inside a CodeBlock*/;

    const { from, to } = selection;

    const blockRange = $from.blockRange();
    if(!blockRange) return false/*no blockRange to select*/;

    const { start, end } = blockRange;
    if(!(from === start+1/*inside the parent*/ && to === end-1/*inside the parent*/)) return false/*not all the content of the parent selected yet*/;

    const codeBlockPos = $from.before(-1/*grandParent depth*/);
    tr.setSelection(TextSelection.create(tr.doc, codeBlockPos+2/*inside the CodeBlock, inside the firstChild*/, codeBlockPos+codeBlock.nodeSize-2/*inside the CodeBlock, inside the lastChild*/));
    return tr/*updated*/;
  }
}

// .. Arrow .......................................................................
/** set a GapCursor if needed while traversing a CodeBlock */
export const codeBlockArrowCommand = (direction: 'up' | 'left' | 'down' | 'right'): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new CodeBlockArrowDocumentUpdate(direction), state, dispatch);
export class CodeBlockArrowDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(public readonly direction: 'up' | 'left' | 'down' | 'right') {/*nothing additional*/}

  /**
   * modify the given Transaction such that a GapCursor is set if needed
   * while traversing a CodeBlock with the arrow keys
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(!tr.selection.empty) return false/*do not handle if not empty*/;

    const { empty, $from, from } = tr.selection;
    if(!empty) return false/*do not allow if not empty*/;

    const codeBlock = $from.node(AncestorDepth.GrandParent);
    if(!codeBlock || !isCodeBlockNode(codeBlock)) return false/*not inside a CodeBlock*/;

    const { firstChild, lastChild } = codeBlock;
    if(!firstChild || !lastChild) return false/*no children*/;

    const codeBlockPos = $from.before(-1/*grandParent depth*/),
          beforeCodeBlockPos = Math.max(0/*do not go behind the Doc*/, codeBlockPos-1),
          afterCodeBlockPos = Math.min(tr.doc.nodeSize-2/*do not go past the Doc, account for start and end*/, codeBlockPos + codeBlock.nodeSize + 1/*past the end*/);

    const currentChild = $from.parent,
          currentChildStart = $from.start(),
          currentChildEnd = $from.end();
    const atStart = from === currentChildStart,
          atEnd = from === currentChildEnd;

    if((currentChild === firstChild) && atStart && (this.direction === 'up' || this.direction === 'left')) {
      tr.setSelection(new GapCursor(tr.doc.resolve(beforeCodeBlockPos)));
      return tr;
    } else if((currentChild === lastChild) && atEnd && (this.direction === 'down' || this.direction === 'right')) {
      tr.setSelection(new GapCursor(tr.doc.resolve(afterCodeBlockPos)));
      return tr;
    } else {
      return false/*not in the first or the last child of the CodeBlock, not at start or end,  or wrong direction, nothing to do*/;
    }
  }
}

// == Format ======================================================================
/** format the CodeBlock with the given language */
export const formatCodeBlockCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new FormatCodeBlockDocumentUpdate(), state, dispatch);
export class FormatCodeBlockDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /** modify the given Transaction such that a CodeBlock is formatted */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = tr,
          { empty, $from } = selection,
          startPos = $from.pos;
    const codeBlock = $from.node(AncestorDepth.GrandParent);
    if(!empty || !codeBlock || !isCodeBlockNode(codeBlock)) return false/*not empty or not inside a CodeBlock*/;

    const language = codeBlock.attrs[AttributeType.Language] ?? CodeBlockLanguage.JavaScript;
    const codeBlockStart = $from.before(AncestorDepth.GrandParent),
          codeBlockEnd = codeBlockStart + codeBlock.nodeSize;
    const textContent = tr.doc.textBetween(codeBlockStart, codeBlockEnd, '\n');

    const formattedTextContent = formatCodeBlockChild(language as CodeBlockLanguage/*by definition*/, textContent);

    const lines = formattedTextContent.split('\n');
    let newCodeBlockContent = Fragment.empty/*default*/;
    for(let i=0; i<lines.length; i++) {
      const lineText = lines[i];
      if(!lineText.length) continue/*skip empty lines*/;

      const paragraph = getParagraphNodeType(editorState.schema).create(undefined/*no attrs*/, editorState.schema.text(lineText));
      newCodeBlockContent = newCodeBlockContent.addToEnd(paragraph);
    }

    const newCodeBlock = getCodeBlockNodeType(editorState.schema).create(codeBlock.attrs, newCodeBlockContent);
    tr.replaceWith(codeBlockStart, codeBlockEnd, newCodeBlock)
      .setSelection(Selection.near(tr.doc.resolve(tr.mapping.map(startPos)), -1/*look backwards first*/));
    return tr;
  }
}

// == Split and Lift ==============================================================
/** split the TextBlock in the CodeBlock and lift it out of it */
export const splitAndLiftOutOfCodeBlockCommand: Command = (state, dispatch) => AbstractDocumentUpdate.execute(new SplitAndLiftOutOfCodeBlockDocumentUpdate(), state, dispatch);
export class SplitAndLiftOutOfCodeBlockDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the TextBlock in the current CodeBlock
   * is split and then lifted out of it
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = tr,
          { $from } = selection;

    const codeBlock = $from.node(AncestorDepth.GrandParent);
    if(!isCodeBlockNode(codeBlock)) return false/*nothing to do*/;
    if(!($from.parent === codeBlock.child(codeBlock.childCount-1/*account for 0 indexing*/))) return false/*not at the end of the codeblock*/;

    tr.split($from.pos, $from.depth);

    const liftedRange = tr.selection.$from.blockRange();
    if(!liftedRange) return false/*no range to lift*/;

    const targetDepth = liftTarget(liftedRange);
    if(!isNotNullOrUndefined<number>(targetDepth)) return false/*no depth to perform lift*/;

    tr.lift(liftedRange, targetDepth);
    return tr/*updated*/;
  }
}

import { GapCursor } from 'prosemirror-gapcursor';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { AbstractDocumentUpdate, isCodeBlockNode, isNotNullOrUndefined } from 'common';

// ********************************************************************************
// == Arrow =======================================================================
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

    const { $from } = tr.selection;
    const codeBlock = $from.node(-1/*grandParent*/);
    if(!codeBlock || !isCodeBlockNode(codeBlock)) return false/*not inside a CodeBlock*/;

    const { firstChild, lastChild } = codeBlock;
    if(!firstChild || !lastChild) return false/*no children*/;

    const codeBlockPos = $from.before(-1/*grandParent depth*/),
          beforeCodeBlockPos = Math.max(0/*do not go behind the Doc*/, codeBlockPos-1),
          afterCodeBlockPos = Math.min(tr.doc.nodeSize-2/*do not go past the Doc, account for start and end*/, codeBlockPos + codeBlock.nodeSize + 1/*past the end*/);

    const currentChild = $from.parent;
    if(firstChild === currentChild && (this.direction === 'up' || this.direction === 'left')) {
      tr.setSelection(new GapCursor(tr.doc.resolve(beforeCodeBlockPos)));
      return tr;
    } else if(lastChild && (this.direction === 'down' || this.direction === 'right')) {
      tr.setSelection(new GapCursor(tr.doc.resolve(afterCodeBlockPos)));
      return tr;
    } else {
      return false/*not in the first or the last child of the CodeBlock or wrong direction, nothing to do*/;
    }
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

    const codeBlock = $from.node(-1/*grandParent*/);
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

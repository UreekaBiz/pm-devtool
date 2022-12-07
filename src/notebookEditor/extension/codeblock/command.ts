import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { isCodeBlockNode, AbstractDocumentUpdate } from 'common';

// ********************************************************************************
export const goIntoCodeBlockArrowCommand = (direction: 'left' | 'right' | 'up' | 'down'): Command => (state, dispatch, view) =>
  AbstractDocumentUpdate.execute(new GoIntoCodeBlockArrowDocumentUpdate(direction), state, dispatch, view);
export class GoIntoCodeBlockArrowDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly direction: 'left' | 'right' | 'up' | 'down') {/*nothing additional*/}

  /**
   * modify the given Transaction such that a Paragraph Node is set following
   * the given constraints (SEE: NOTE above) and return it
   */
  public update(editorState: EditorState, tr: Transaction, view?: EditorView) {
    if(!view) return false/*View not given*/;

    const wouldLeaveTextBlock = view.endOfTextblock(this.direction);
    if(!wouldLeaveTextBlock) return false/*would not leave TextBlock*/;

    const resultingSelectionSide = this.direction === 'left' || this.direction === 'up' ? -1/*left/upwards*/ : 1/*right/downwards*/,
          { $head } = editorState.selection,
          nextPos = Selection.near(editorState.doc.resolve(resultingSelectionSide < 0/*left/upwards*/ ? $head.before() : $head.after()), resultingSelectionSide);
    if(!isCodeBlockNode(nextPos.$head.parent)) return false/*no CodeBlock to select after moving in direction*/;

    tr.setSelection(nextPos);
    return tr/*updated*/;
  }
}

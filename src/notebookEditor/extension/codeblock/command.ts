import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { AbstractDocumentUpdate, isCodeBlockNode, isNotNullOrUndefined } from 'common';

// ********************************************************************************
export const splitAndLiftOutOfCodeBlock: Command = (state, dispatch) => AbstractDocumentUpdate.execute(new SplitAndLiftOutOfCodeBlockDocumentUpdate(), state, dispatch);
export class SplitAndLiftOutOfCodeBlockDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
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

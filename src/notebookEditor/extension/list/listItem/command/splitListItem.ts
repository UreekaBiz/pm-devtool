import { Command, EditorState, Transaction } from 'prosemirror-state';

import { getListItemNodeType, AbstractDocumentUpdate } from 'common';

import { LiftListItemDocumentUpdate } from './liftListItem';
import { fromOrToInListItem } from './util';

// == Split =======================================================================
// split the ListItem at the current Selection while maintaining active Marks
// in the new ListItem
export const splitListItemKeepMarksCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SplitListItemKeepMarksDocumentUpdate().update(state, state.tr), dispatch);
export class SplitListItemKeepMarksDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the ListItem at the Selection is
   * split and the new one maintains the active Marks
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = editorState;
    const listItemType = getListItemNodeType(editorState.schema);
    if(!fromOrToInListItem(listItemType, selection)) return false/*Selection not inside a ListItem*/;

    // check if lifting must be done
    const { $from, $to } = selection;
    if($from.parent.content.size < 1/*empty*/) {
      const updatedTr = new LiftListItemDocumentUpdate().update(editorState, tr);
      return updatedTr/*updated*/;
    } /* else -- parent of from is has content, split */

    tr.delete($from.pos, $to.pos);
    const { attrs: listItemAttrs } = $from.node(/*parent*/);
    tr.split($from.pos, 1/*maintain parent List depth*/, [ { type: listItemType, attrs: listItemAttrs } ]).scrollIntoView();

    const marks = editorState.storedMarks || (editorState.selection.$to.parentOffset && editorState.selection.$from.marks());
    if(marks) {
      tr.ensureMarks(marks);
    } /* else -- no marks to preserve after split */

    return tr/*updated*/;
  }
}

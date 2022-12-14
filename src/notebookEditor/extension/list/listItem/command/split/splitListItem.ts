import { Command, EditorState, Transaction } from 'prosemirror-state';

import { getListItemNodeType, isNodeEmpty, AbstractDocumentUpdate, AncestorDepth } from 'common';

import { fromOrToInListItem } from '../../util';

// == Split =======================================================================
// split the ListItem at the current Selection while maintaining active Marks
// in the new ListItem
export const splitListItemCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SplitListItemDocumentUpdate(), state, dispatch);
export class SplitListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that the ListItem at the Selection is
   * split and the new one maintains the active Marks
   */
  public update(editorState: EditorState, tr: Transaction) {
    // -- Checks ------------------------------------------------------------------
    const { selection } = editorState;
    const listItemType = getListItemNodeType(editorState.schema);
    if(!fromOrToInListItem(selection)) return false/*Selection not inside a ListItem*/;

    const { $from, $to } = selection;
    if(isNodeEmpty($from.parent)) return false/*do not allow splitting if empty*/;

    // -- Split -------------------------------------------------------------------
    const originalMarks = editorState.storedMarks || tr.storedMarks || ($to.parentOffset && $from.marks());

    tr.delete($from.pos, $to.pos);
    const { attrs: listItemAttrs } = $from.node(AncestorDepth.GrandParent);
    tr.split($from.pos, 2/*maintain current child of ListItem (e.g. a Paragraph), and the ListItem type after split*/, [ { type: listItemType, attrs: listItemAttrs } ]).scrollIntoView();

    if(originalMarks) {
      tr.ensureMarks(originalMarks);
    } /* else -- no marks to preserve after split */

    return tr/*updated*/;
  }
}

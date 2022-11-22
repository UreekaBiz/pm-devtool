import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { AbstractDocumentUpdate, NodeGroup } from 'common';

import { fromOrToInListItem, getListItemPositions } from './util';

// ********************************************************************************
// == Lift ========================================================================
// lift a ListItem
export const liftListItemCommand = (from: 'Enter' | 'Shift-Tab' | 'Backspace'): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemDocumentUpdate(from), state, dispatch);
export class LiftListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly from: 'Enter' | 'Shift-Tab' | 'Backspace') {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {
    if(!fromOrToInListItem(editorState.selection)) return false/*Selection not inside a ListItem*/;

    const { empty, from, to } = editorState.selection;
    if(this.from === 'Backspace' && !empty) return false/*do not allow if Selection not empty when Back*/;

    const listItemPositions = getListItemPositions(editorState, { from, to }).reverse(/*from deepest to most shallow*/);

    for(let i=0; i<listItemPositions.length; i++) {
      const updatedTr = liftListItem(tr, listItemPositions[i]);
      if(updatedTr) { tr = updatedTr; }
      else { return false/*could not lift*/; }
    }

    return tr/*updated*/;
  }
}

// perform the required modifications to a Transaction such that
// the Item at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const listItemBlockRange = tr.doc.resolve(listItemPos).blockRange();
  if(!listItemBlockRange) return false/*cannot lift item, do not modify Transaction*/;

  // try lift the contents of the ListItem
  if(listItemBlockRange.depth) {
    const targetDepth = liftTarget(listItemBlockRange);
    if(targetDepth === null || targetDepth === undefined) return false/*cannot perform lift operation*/;

    tr.lift(listItemBlockRange, targetDepth ? targetDepth : listItemBlockRange.depth - 1/*lift to parent*/);
  } /* else -- range has depth 0 */

  // if the ListItem has depth 0 or its parent after lifting is not a List, delete the ListItem Range,
  // leaving only the content outside
  const listItemBlockStart = tr.doc.resolve(tr.mapping.map(listItemBlockRange.start));
  if(!listItemBlockStart.depth || !listItemBlockStart.parent.type.spec.group?.includes(NodeGroup.LIST)) {
    if(!listItemBlockStart.nodeAfter) return false/*no node after the range's start*/;
    if(!tr.doc.type.contentMatch.defaultType) return false/*cannot insert a default NodeType at this position*/;

    const firstChildOfList = listItemBlockStart.nodeAfter/*the listItem*/.firstChild;
    const liftedContent = firstChildOfList?.copy(firstChildOfList.content);
    if(!liftedContent) return false/*no child to lift*/;

    tr.replaceWith(listItemBlockStart.pos, listItemBlockStart.pos + listItemBlockStart.nodeAfter/*the listItem*/.nodeSize, liftedContent)
      .setSelection(Selection.near(tr.doc.resolve(listItemBlockStart.pos)));

  } /* else -- depth is defined or parent of range start is of type List */

  return tr;
};

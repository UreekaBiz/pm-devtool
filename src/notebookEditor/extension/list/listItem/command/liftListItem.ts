import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { AbstractDocumentUpdate, NodeGroup } from 'common';

import { getListItemPositions } from './util';

// ********************************************************************************
// == Lift ========================================================================
// lift a ListItem
export const liftListItemCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemDocumentUpdate().update(state, state.tr), dispatch);
export class LiftListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {
    const { from, to } = editorState.selection;
    const listItemPositions = getListItemPositions(editorState, { from, to }).reverse();
    listItemPositions.forEach(listItemPos => liftListItem(tr, listItemPos));
    return tr/*updated*/;
  }
}

// perform the required modifications to a Transaction such that
// the Item at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const listItemBlockRange = tr.doc.resolve(listItemPos).blockRange();
  if(!listItemBlockRange) return tr/*cannot lift item, do not modify Transaction*/;

  // try lift the contents of the ListItem
  if(listItemBlockRange.depth) {
    const targetDepth = liftTarget(listItemBlockRange);
    if(targetDepth === null || targetDepth === undefined) return tr/*cannot perform lift operation*/;

    tr.lift(listItemBlockRange, targetDepth ? targetDepth : listItemBlockRange.depth - 1/*lift to parent*/);
  } /* else -- range has depth 0 */

  // if the ListItem has depth 0 or its parent after lifting is not a List, delete the ListItem Range,
  // leaving only the content outside
  const listItemBlockStart = tr.doc.resolve(tr.mapping.map(listItemBlockRange.start));
  if(!listItemBlockStart.depth || !listItemBlockStart.parent.type.spec.group?.includes(NodeGroup.LIST)) {
    if(!listItemBlockStart.nodeAfter) return tr/*no node after the range's start*/;
    if(!tr.doc.type.contentMatch.defaultType) return tr/*cannot insert a default NodeType at this position*/;

    tr.delete(listItemBlockStart.pos, listItemBlockStart.pos + listItemBlockStart.nodeAfter.nodeSize);
  } /* else -- depth is defined or parent of range start is of type List */

  return tr;
};

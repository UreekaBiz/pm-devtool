import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { getListItemNodeType, AbstractDocumentUpdate, NodeGroup } from 'common';

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
    const listItemPositions = getListItemPositions(editorState, { from, to }, getListItemNodeType(editorState.schema)).reverse();
    listItemPositions.forEach(listItemPos => liftListItem(tr, listItemPos));
    return tr/*updated*/;
  }
}

// perform the required modifications to a Transaction such that
// the Item at the given position is lifted
const liftListItem = (tr: Transaction, listItemPos: number) => {
  const listItemBlockRange = tr.doc.resolve(listItemPos).blockRange();
  if(!listItemBlockRange) return tr/*cannot lift item, do not modify Transaction*/;

  if(listItemBlockRange.depth) {
    const target = liftTarget(listItemBlockRange);
    if(target === null || target === undefined) return tr/*cannot perform lift operation*/;

    tr.lift(listItemBlockRange, target ? target : listItemBlockRange.depth - 1/*lift to parent*/);
  } /* else -- range has depth 0 */

  const listItemBlockStart = tr.doc.resolve(tr.mapping.map(listItemBlockRange.start));
  if(!listItemBlockStart.depth || !listItemBlockStart.parent.type.spec.group?.includes(NodeGroup.LIST)) {
    if(!listItemBlockStart.nodeAfter) return tr/*no node after the range's start*/;
    if(!tr.doc.type.contentMatch.defaultType) return tr/*cannot insert a default NodeType at this position*/;

    tr.setBlockType(listItemBlockStart.pos, listItemBlockStart.pos + listItemBlockStart.nodeAfter.nodeSize, tr.doc.type.contentMatch.defaultType);
  } /* else -- depth is defined or parent of range start is of type List */

  return tr;
};

// --------------------------------------------------------------------------------
// lift the ListItem at the Selection if afterwards its content would become
// direct child of the Document
export const liftListItemToDocumentCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemAtHeadDocumentUpdate().update(state, state.tr), dispatch);
export class LiftListItemAtHeadDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  /**
   * modify the given Transaction such that ListItem at the Selection is lifted
   * if afterwards its content would become a direct child of the Document
   */
  public update(editorState: EditorState, tr: Transaction) {
    if(editorState.selection.empty && !editorState.selection.$from.nodeBefore) {
      const updatedTr = new LiftListItemDocumentUpdate().update(editorState, tr);
      if(updatedTr) {
        return updatedTr;
      } /* else -- could not lift ListItem */
    } /* else -- Selection is not empty or there is a nodeBefore */

    return false/*default*/;
  }
}

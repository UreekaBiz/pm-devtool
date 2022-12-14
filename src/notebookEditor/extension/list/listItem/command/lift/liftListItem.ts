import { NodeRange } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

import { isGapCursorSelection, isNodeEmpty, isNotNullOrUndefined, AbstractDocumentUpdate } from 'common';

import { getListItemChildrenPositions } from '../../util';

// ********************************************************************************
export enum LiftListOperation {
  // the Untoggle operation is associated with Enter, whenever a ListItem is empty,
  // there is no Selection, and the cursor is at the start of the TextBlock inside
  // the ListItem
  Untoggle = 'Untoggle',

  // the Dedent operation is associated with Shift-Tab, regardless of whether or
  // not the ListItem TextBlock is empty, since the User just wants to decrease
  // the indentation of the selected ListItems
  Dedent = 'dedent',

  // the Remove operation is associated with Backspace, since the User wants to
  // decrease the indentation of the selected ListItem. It has the
  // same restrictions as the Untoggle operation
  Remove = 'remove',
}

// == Lift ========================================================================
// lift a ListItem
export const liftListItemCommand = (operation: LiftListOperation): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new LiftListItemDocumentUpdate(operation), state, dispatch);
export class LiftListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly operation: LiftListOperation) {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction) {
    // -- Checks ------------------------------------------------------------------
    const { doc, selection } = editorState;
    if(isGapCursorSelection(selection)) return false/*do not allow*/;

    const { empty, $from, from, to } = selection;
    if(this.operation === LiftListOperation.Untoggle || this.operation === LiftListOperation.Remove) {
      if(!empty) return false/*do not allow if Selection not empty*/;
      if(($from.before()+1/*immediately inside the TextBlock*/ !== from)) return false/*Selection is not at the start of the parent TextBlock*/;

      if(this.operation === LiftListOperation.Untoggle) {
        if(!isNodeEmpty($from.parent)) return false/*only allow lift on Enter if parent is empty*/;
      } /* else -- do not check enter-specific case */
    } /* else -- backspace / enter checks done */

    // -- Sink --------------------------------------------------------------------
    const listItemChildrenPositions = getListItemChildrenPositions(doc, { from, to });
          listItemChildrenPositions.forEach(childPos => liftListItemChild(tr, childPos));

    if(tr.docChanged) return tr/*updated*/;
    else return false/*no changes were made to the doc*/;
  }
}

// ================================================================================
// perform the required modifications to a Transaction such that
// the ListItem child at the given position is lifted
const liftListItemChild = (tr: Transaction, childPos: number) => {
  const mappedChildPos = tr.mapping.map(childPos),
        child = tr.doc.nodeAt(mappedChildPos),
        $childPos = tr.doc.resolve(mappedChildPos);
  if(!child) return/*cannot lift item, do not modify Transaction*/;

  const childEndPos = mappedChildPos + child.nodeSize,
        $childEndPos = tr.doc.resolve(childEndPos);
  const liftBlockRange: NodeRange | null = new NodeRange($childPos, $childEndPos, $childPos.depth);

  const targetDepth = liftTarget(liftBlockRange);
  if(!isNotNullOrUndefined<number>(targetDepth)) return/*no target depth to lift child to*/;

  tr.lift(liftBlockRange, targetDepth);
  return tr;
};

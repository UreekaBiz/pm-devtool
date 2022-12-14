import { NodeRange } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, isGapCursorSelection, findParentNodeClosestToPos, isListNode, getListItemNodeType } from 'common';
import { fromOrToInListItem, getListItemChildrenPositions } from './util';

// ********************************************************************************
// == Sink ========================================================================
// sink a ListItem
export const sinkListItemCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SinkListItemDocumentUpdate(), state, dispatch);
export class SinkListItemDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /** modify the given Transaction such that a ListItem augments its depth */
  public update(editorState: EditorState, tr: Transaction) {
    // -- Checks ------------------------------------------------------------------
    const { doc, selection } = editorState,
          { empty, $from, from, to } = selection;

    if(isGapCursorSelection(selection)) return false/*do not allow*/;
    if(!fromOrToInListItem(editorState.selection)) return false/*Selection not inside a ListItem*/;
    if(empty && from !== $from.before() + 1/*immediately at the start of the parent Block*/) return false/*do not allow*/;

    // -- Sink --------------------------------------------------------------------
    const listItemChildrenPositions = getListItemChildrenPositions(doc, { from, to });
          listItemChildrenPositions.forEach(childPos => sinkListItemChild(tr, childPos));

    if(tr.docChanged) return tr/*updated*/;
    else return false/*no changes were made to the doc*/;
  }
}

// ================================================================================
// perform the required modifications to a Transaction such that
// the ListItem at the given position increases its depth
const sinkListItemChild = (tr: Transaction, childPos: number) => {
  const mappedChildPos = tr.mapping.map(childPos),
        $childPos = tr.doc.resolve(mappedChildPos),
        child = tr.doc.nodeAt(mappedChildPos);
  if(!child) return/*not a ListItem at the expected position */;

  const childEndPos = mappedChildPos + child.nodeSize,
        $childEndPos = tr.doc.resolve(childEndPos);
  const sinkBlockRange = new NodeRange($childPos, $childEndPos, $childPos.depth/*depth*/);

  const closestListObj = findParentNodeClosestToPos($childPos, isListNode);
  if(!closestListObj) return/*no list to take type from*/;

  tr.wrap(sinkBlockRange, [{ type: closestListObj.node.type, attrs: closestListObj.node.attrs }, { type: getListItemNodeType(closestListObj.node.type.schema), attrs: undefined/*no attrs*/ }]);
  return tr/*modified*/;
};



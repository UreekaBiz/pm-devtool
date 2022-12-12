import { Command, EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, isListItemNode, AbstractDocumentUpdate, Attributes, NodeName, isNonTextBlockBlock } from 'common';

import { LiftListItemDocumentUpdate } from '../listItem/command';
import { isListBeforeCurrentBlockRange } from './util';

// ********************************************************************************
// toggle the type of a List
export const toggleListCommand = (listTypeName: NodeName.UNORDERED_LIST | NodeName.ORDERED_LIST, attrs: Partial<Attributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleListDocumentUpdate(listTypeName, attrs), state, dispatch);
export class ToggleListDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly listTypeName: NodeName.UNORDERED_LIST | NodeName.ORDERED_LIST, private readonly attrs: Partial<Attributes>) {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction): Transaction | false {
    // -- Checks ------------------------------------------------------------------
    const { selection } = editorState,
          { $from, from, $to, to } = selection;

    const listItemType = editorState.schema.nodes[NodeName.LIST_ITEM],
          listType = editorState.schema.nodes[this.listTypeName];

    // -- Toggle ------------------------------------------------------------------
    let listItemRange = $from.blockRange($to);
    if(!listItemRange) return false/*no blockRange exists, nothing to do*/;
    const { depth: blockRangeDepth } = listItemRange;
    const closestParentList = findParentNodeClosestToPos(listItemRange.$from, (node, depth) => isListBeforeCurrentBlockRange(blockRangeDepth, node, depth));

    if(closestParentList) {
      if(canUntoggleNestedList(closestParentList.depth, listItemRange.depth) && closestParentList.node.type === listType) return new LiftListItemDocumentUpdate('Shift-Tab'/*dedent*/).update(editorState, tr);
      else /*change type*/ return tr.setNodeMarkup(closestParentList.pos, listType, this.attrs)/*updated*/;
    } /* else -- wrap */

    // -- Wrap --------------------------------------------------------------------
    const nearestBlockParent = findParentNodeClosestToPos(listItemRange.$from, isNonTextBlockBlock)?.node ?? tr.doc/*default parent*/;
    const nearestBlockChildrenPositions: number[] = [/*default empty*/];
    tr.doc.nodesBetween(from, to, (node, pos, parent, index) => {
      if(parent && parent === nearestBlockParent) {
        nearestBlockChildrenPositions.push(pos+1/*inside the Child*/);
      } /* else -- ignore */
    });

    // nearestBlockChildrenPositions.forEach(child => wrapChild(child));
    for(let i=0; i<nearestBlockChildrenPositions.length; i++) {
      const $pos = tr.doc.resolve(tr.mapping.map(nearestBlockChildrenPositions[i])),
            nodeAtPos = tr.doc.nodeAt($pos.pos);

      // prevent wrapping an already wrapped ListItem
      if(nodeAtPos && isListItemNode(nodeAtPos)) continue/*already wrapped*/;

      const blockRange = $pos.blockRange();
      if(!blockRange) continue/*no range to wrap*/;
      tr.wrap(blockRange, [{ type: listType, attrs: this.attrs }, { type: listItemType }]);
    }
    return tr/*updated*/;
  }
}

// == Util ========================================================================
/**
 * check whether the depths of a List and the range of a ListItem
 * are such that the List can be untoggled, and hence the ListItem lifted
 */
const canUntoggleNestedList = (parentListDepth: number, listItemRangeDepth: number) =>
  (listItemRangeDepth - parentListDepth <= 1/*can perform a lift*/) && (listItemRangeDepth >= 1/*listItem is nested*/);

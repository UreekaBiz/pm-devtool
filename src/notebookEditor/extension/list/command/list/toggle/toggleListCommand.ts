import { Node as ProseMirrorNode, NodeType } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, isListItemNode, AbstractDocumentUpdate, Attributes, NodeName, isNonTextBlockBlock, isListNode } from 'common';

import { LiftListItemDocumentUpdate, LiftListOperation } from '../../listItem/command';

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

    let blockRange = $from.blockRange($to);
    if(!blockRange) return false/*no blockRange exists, nothing to do*/;
    const { depth: blockRangeDepth } = blockRange;

    // -- Toggle ------------------------------------------------------------------
    const closestParentList = findParentNodeClosestToPos(blockRange.$from, (node, depth) => isListBeforeCurrentBlockRange(blockRangeDepth, node, depth));
    if(closestParentList) {
      if(canUntoggleNestedList(closestParentList.depth, blockRange.depth) && closestParentList.node.type === listType) return new LiftListItemDocumentUpdate(LiftListOperation.Dedent).update(editorState, tr);
      else /*change type*/ return tr.setNodeMarkup(closestParentList.pos, listType, this.attrs)/*updated*/;
    } /* else -- wrap */

    // -- Wrap --------------------------------------------------------------------
    const nearestBlockParent = findParentNodeClosestToPos(blockRange.$from, isNonTextBlockBlock)?.node ?? tr.doc/*default parent*/;
    const nearestBlockChildrenPositions: number[] = [/*default empty*/];
    tr.doc.nodesBetween(from, to, (node, pos, parent, index) => {
      if(!parent || parent !== nearestBlockParent) return/*ignore Node*/;
      nearestBlockChildrenPositions.push(pos+1/*inside the Child*/);
    });

    nearestBlockChildrenPositions.forEach(childPosition => wrapChildInList(tr, childPosition, listType, listItemType, this.attrs));
    return tr/*updated*/;
  }
}

// == Util ========================================================================
// NOTE: only take into account ListItems whose depth is greater than or equal to
//       blockRangeDepth - 1, so that for example:
//       ul(li(blockquote(p('hello')))) will not return the top level UL
//       and will instead wrap the paragraph
const isListBeforeCurrentBlockRange = (blockRangeDepth: number, node: ProseMirrorNode, nodeDepth: number) =>
  isListNode(node) && (nodeDepth >= blockRangeDepth - 1/*direct ancestor of blockRange*/);

/**
 * wrap the Node at the given childPosition in the given listItemType and then
 * in a List of the given listType
 */
const wrapChildInList = (tr: Transaction, childPosition: number, listType: NodeType, listItemType: NodeType, attrs: Partial<Attributes>) => {
  const $pos = tr.doc.resolve(tr.mapping.map(childPosition)),
        nodeAtPos = tr.doc.nodeAt($pos.pos);

  // prevent wrapping an already wrapped ListItem
  if(nodeAtPos && isListItemNode(nodeAtPos)) return/*already wrapped*/;

  const blockRange = $pos.blockRange();
  if(!blockRange) return/*no range to wrap*/;
  tr.wrap(blockRange, [{ type: listType, attrs: attrs }, { type: listItemType }]);
};

/**
 * check whether the depths of a List and the range of a ListItem
 * are such that the List can be untoggled, and hence the ListItem lifted
 */
const canUntoggleNestedList = (parentListDepth: number, listItemRangeDepth: number) =>
  (listItemRangeDepth - parentListDepth <= 1/*can perform a lift*/) && (listItemRangeDepth >= 1/*listItem is nested*/);

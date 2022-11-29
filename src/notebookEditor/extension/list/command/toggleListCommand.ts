import { Command, EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, isListNode, isListItemNode, AbstractDocumentUpdate, Attributes, NodeName } from 'common';

import { LiftListItemDocumentUpdate } from '../listItem/command';

// ********************************************************************************
// toggle the type of a List
export const toggleListCommand = (listTypeName: NodeName.BULLET_LIST | NodeName.ORDERED_LIST, attrs: Partial<Attributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new ToggleListDocumentUpdate(listTypeName, attrs), state, dispatch);
export class ToggleListDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly listTypeName: NodeName.BULLET_LIST | NodeName.ORDERED_LIST, private readonly attrs: Partial<Attributes>) {/*nothing additional*/}

  /** modify the given Transaction such that a ListItem is lifted */
  public update(editorState: EditorState, tr: Transaction): Transaction | false {
    const { selection } = editorState,
          { $from, from, $to, to } = selection;

    const listItemType = editorState.schema.nodes[NodeName.LIST_ITEM],
          listType = editorState.schema.nodes[this.listTypeName];

    let blockRange = $from.blockRange($to);
    if(!blockRange) return false/*no blockRange exists, nothing to do*/;
    const { depth: blockRangeDepth } = blockRange;

    /**
     * NOTE: only take into account ListItems whose depth is greater than or equal to
     *       blockRangeDepth - 1, so that for example:
     *       bl(li(blockquote(p('hello')))) will not return the top level bulletList
     *       and will instead wrap the paragraph
     */
    const closestParentList = findParentNodeClosestToPos(blockRange.$from, (node, depth) => depth >= blockRangeDepth-1/*(SEE: NOTE above)*/ && isListNode(node));

    if(closestParentList) {
      if(blockRange.depth >= 1/*is nested*/
        && closestParentList/*exists*/
        && blockRange.depth - closestParentList.depth <= 1/*can lift*/) {
        if(closestParentList.node.type === listType) { return new LiftListItemDocumentUpdate('Shift-Tab'/*dedent*/).update(editorState, tr); }
        else /*change type */ { tr.setNodeMarkup(closestParentList.pos, listType, this.attrs); }
      } /* else - not nested, list does not exist, or cannot lift*/
    } else /*wrap*/ {
      let nearestBlockParent = findParentNodeClosestToPos(blockRange.$from, (node) => (node.isBlock && !node.isTextblock))?.node;
      if(!nearestBlockParent) {
        nearestBlockParent = tr.doc;
      } /* else -- use nearest parent */
      const nearestBlockChildrenPositions: number[] = [/*default empty*/];

      tr.doc.nodesBetween(from, to, (node, pos, parent, index) => {
        if(parent && parent === nearestBlockParent) {
          nearestBlockChildrenPositions.push(pos+1/*inside the Child*/);
        } /* else -- ignore */
      });

      for(let i=0; i<nearestBlockChildrenPositions.length; i++) {
        const $pos = tr.doc.resolve(tr.mapping.map(nearestBlockChildrenPositions[i]));
        const nodeAtPos = tr.doc.nodeAt($pos.pos);
        if(nodeAtPos && isListItemNode(nodeAtPos)) continue/*already wrapped*/;

        const blockRange = $pos.blockRange();
        if(!blockRange) continue/*no range to wrap*/;
        tr.wrap(blockRange, [{ type: listType, attrs: this.attrs }, { type: listItemType }]);
      }
    }

    return tr/*updated*/;
  }
}

import { Command, EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos, AbstractDocumentUpdate, Attributes, NodeName, isDocumentNode, isListItemNode } from 'common';

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

    const closestParentList = findParentNodeClosestToPos(blockRange.$from, (node) =>
      node.type.name === NodeName.BULLET_LIST || node.type.name === NodeName.ORDERED_LIST);

    if(closestParentList) {
      if(blockRange.depth >= 1/*is nested*/
        && closestParentList/*exists*/
        && blockRange.depth - closestParentList.depth <= 1/*can lift*/) {
        if(closestParentList.node.type === listType) { return new LiftListItemDocumentUpdate('Shift-Tab'/*dedent*/).update(editorState, tr); }
        else /*change type */ { tr.setNodeMarkup(closestParentList.pos, listType, this.attrs); }
      } /* else - not nested, list does not exist, or cannot lift*/
    } else /*wrap*/ {
      const insideDocBlockChildrenPositions: number[] = [/*default empty*/];
      tr.doc.nodesBetween(from, to, (node, pos, parent, index) => {
        if(parent && isDocumentNode(parent)) {
          insideDocBlockChildrenPositions.push(pos+1/*inside the Child*/);
        } /* else -- ignore */
      });

      for(let i=0; i<insideDocBlockChildrenPositions.length; i++) {
        const $pos = tr.doc.resolve(tr.mapping.map(insideDocBlockChildrenPositions[i]));
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

import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, AttributeType, isListItemNode, SelectionRange, LIST_ITEM_DEFAULT_MARGIN_INCREASE, LIST_ITEM_DEFAULT_MARGIN_LEFT } from 'common';

import { separateUnitFromString } from 'notebookEditor/theme';

// ********************************************************************************
export const changeListItemMarginCommand = (changeType: 'increase' | 'decrease'): Command => (state, dispatch) => AbstractDocumentUpdate.execute(new IncreaseListItemMarginDocumentUpdate(changeType), state, dispatch);
export class IncreaseListItemMarginDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly changeType: 'increase' | 'decrease') {/*nothing additional*/}

  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = tr,
          { $from, from, $to, to } = selection;

    // const listItemNodeType = getListItemNodeType(editorState.schema);
    const blockRange = $from.blockRange($to);
    if(!blockRange) return false/*no range in which to lift ListItems*/;
    const { depth: blockRangeDepth } = blockRange;

    const listItemPositions = getListItemPositions(tr.doc, { from, to }, blockRangeDepth-1/*depth of blockRange wrapper*/);
    listItemPositions.forEach(listItemPos => {
      const listItem = tr.doc.nodeAt(listItemPos);
      if(!listItem || !isListItemNode(listItem)) return/*ignore node*/;

      let currentMargin = listItem.attrs[AttributeType.MarginLeft];
      if(!currentMargin) {
        currentMargin = LIST_ITEM_DEFAULT_MARGIN_LEFT;
      } /* else -- no need to increase */

      const [value, unit] = separateUnitFromString(currentMargin);
      const newValue = this.changeType === 'increase' ? Number(value) + LIST_ITEM_DEFAULT_MARGIN_INCREASE : Number(value) - LIST_ITEM_DEFAULT_MARGIN_INCREASE;

      const newMargin = `${Math.max(0, newValue)}${unit}`;
      if(newMargin === currentMargin) return/*no change*/;

      tr.setNodeMarkup(listItemPos, undefined/*maintain type*/, { [AttributeType.MarginLeft]: newMargin });
    });

    if(tr.docChanged) return tr/*updated*/;
    else return false/*no changes*/;
  }
}

// == Util ========================================================================
// NOTE: only take into account ListItems whose depth is greater than or equal to
//       the given maxDepth, so that for example:
//       ul(li(blockquote(li(p('hello'))))) will not return the first ListItem,
//       only inner most one
/**
 * get the position inside each ListItem present in the given Range.
 * only the ListItems that have a depth greater than or equal to maxDepth
 * will be returned (SEE: NOTE above)
 */
export const getListItemPositions = (doc: ProseMirrorNode, selectionRange: SelectionRange, maxDepth: number) => {
  const { from, to } = selectionRange;
  const listItemPositions: number[] = [/*default empty*/];

  doc.nodesBetween(from, to, (node, pos) => {
    if(!isListItemNode(node)) return/*ignore Node*/;

    const $listItemPos = doc.resolve(pos);
    if(!($listItemPos.depth >= maxDepth)) return/*depth is not greater than or equal to maxDepth*/;

    listItemPositions.push(pos);
  });

  return listItemPositions;
};

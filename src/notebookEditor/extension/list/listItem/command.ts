import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate, AttributeType, getListItemNodeType, isListItemNode, LIST_ITEM_DEFAULT_MARGIN_INCREASE, LIST_ITEM_DEFAULT_MARGIN_LEFT } from 'common';
import { separateUnitFromString } from 'notebookEditor/theme';

// ********************************************************************************
export const increaseListItemMarginCommand: Command = (state, dispatch) => AbstractDocumentUpdate.execute(new IncreaseListItemMarginDocumentUpdate(), state, dispatch);
export class IncreaseListItemMarginDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/}

  public update(editorState: EditorState, tr: Transaction) {
    const { selection } = tr,
          { from, to } = selection;

    const listItemNodeType = getListItemNodeType(editorState.schema);
    tr.doc.nodesBetween(from, to, (node, nodePos) => {
      if(!isListItemNode(node)) return/*ignore node*/;

      let currentMargin = node.attrs[AttributeType.MarginLeft];
      if(!currentMargin) {
        currentMargin = LIST_ITEM_DEFAULT_MARGIN_LEFT;
      } /* else -- no need to increase */

      const [value, unit] = separateUnitFromString(currentMargin);
      const newMargin = `${Number(value) + LIST_ITEM_DEFAULT_MARGIN_INCREASE}${unit}`;

      tr.setNodeMarkup(nodePos, listItemNodeType, { [AttributeType.MarginLeft]: newMargin });
    });

    if(tr.docChanged) return tr/*updated*/;
    else return false/*no changes*/;
  }
}

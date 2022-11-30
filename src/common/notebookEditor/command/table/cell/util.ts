import { Fragment, Node as ProseMirrorNode, NodeType } from 'prosemirror-model';

// ********************************************************************************
/** create a default Cell whose content is checked to be valid */
export const createCell = (cellType: NodeType, cellContent?: Fragment | ProseMirrorNode | Array<ProseMirrorNode>): ProseMirrorNode | null | undefined => {
  if(cellContent) {
    return cellType.createChecked(null/*no attrs*/, cellContent);
  } /* else -- there is no content, create and fill */

  return cellType.createAndFill();
};

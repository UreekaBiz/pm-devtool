import { Fragment, Node as ProseMirrorNode, NodeType } from 'prosemirror-model';

// ********************************************************************************
export const createCell = (cellType: NodeType, cellContent?: Fragment | ProseMirrorNode | Array<ProseMirrorNode>): ProseMirrorNode | null | undefined => {
  if(cellContent) {
    return cellType.createChecked(null, cellContent);
  } /* else -- there is no content, create and fill */

  return cellType.createAndFill();
};

import { Mark as ProseMirrorMark, Node as ProseMirrorNode } from 'prosemirror-model';

import { Attributes, AttributeType, AttributeValue } from './attribute';

// ********************************************************************************
export type JSONMark<A extends Attributes = {}> = {
  type: MarkName;

  // Attributes are not required in a mark and potentially not be present.
  attrs?: Partial<A>;
};

// ================================================================================
export enum MarkName {
  BOLD = 'bold',
  TEXT_STYLE = 'textStyle',
}
export const getMarkName = (mark: ProseMirrorMark) => mark.type.name as MarkName;

// == Util ========================================================================
/**
 * Gets the given mark from the given node. Returns undefined if the mark is not
 * found.
 */
export const getMark = (node: ProseMirrorNode, markName: MarkName) => {
  return node.marks.find(mark => mark.type.name === markName);
};

/**
 * Gets the value of the mark from the given node. Returns undefined if the mark is
 * not found or the mark has no value.
 */
export const getMarkValue = (node: ProseMirrorNode, markName: MarkName, attributeType: AttributeType): AttributeValue | undefined=> {
  const mark = getMark(node, markName);
  const value = mark ? mark.attrs[attributeType] : undefined;

  return value;
};

import { Command, EditorState, Transaction } from 'prosemirror-state';

import { getBlockNodeRange, getHeadingNodeType, generateNodeId, getSelectedNode, isHeadingLevel, isHeadingNode, AbstractDocumentUpdate, AttributeType, HeadingAttributes, NodeName, NodeIdentifier, UpdateAttributesDocumentUpdate } from 'common';

import { SetParagraphDocumentUpdate } from '../paragraph/command';

// ********************************************************************************
export const setHeadingCommand = (attributes: Partial<HeadingAttributes>): Command => (state, dispatch) =>
  AbstractDocumentUpdate.execute(new SetHeadingDocumentUpdate(attributes), state, dispatch);
export class SetHeadingDocumentUpdate implements AbstractDocumentUpdate {
  public constructor(private readonly attributes: Partial<HeadingAttributes>) {/*nothing additional*/ }

  public update(editorState: EditorState, tr: Transaction) {
    const { level } = this.attributes;
    if(!level || !isHeadingLevel(level)) return false/*invalid command, level for Heading not supported*/;

    const parent = getSelectedNode(editorState, editorState.selection.$anchor.depth);
    if(!parent) return false/*nothing to do, no parent Node*/;

    const { schema } = editorState;
    const { empty } = editorState.selection/*NOTE: empty implies that parent($anchor) === parent($head)*/;
    const { from, to } = getBlockNodeRange(editorState.selection);

    // check for toggle or level change
    if(empty && isHeadingNode(parent)) {
      // check for toggle
      if(parent.attrs[AttributeType.Level] === level) {
        const updatedTr = new SetParagraphDocumentUpdate().update(editorState, tr);
        return updatedTr/*updated, nothing left to do*/;
      } /* else -- level change */

      const updatedTr = new UpdateAttributesDocumentUpdate(NodeName.HEADING, { ...parent.attrs, [AttributeType.Level]: this.attributes.level }).update(editorState, tr);
      return updatedTr/*updated, nothing left to do*/;
    } /* else -- not a toggle or level change, setHeading */

    tr.setBlockType(from, to, getHeadingNodeType(schema), { [AttributeType.Id]: generateNodeId(), [AttributeType.Level]: level });

    const seenIds = new Set<NodeIdentifier>();
    tr.doc.nodesBetween(from, to, (node, nodePos) => {
      const id = node.attrs[AttributeType.Id];
      if(id === null/*new Heading, no Id set*/ || id && isHeadingNode(node) && seenIds.has(id)) {
        tr.setNodeMarkup(nodePos, node.type, { ...node.attrs, [AttributeType.Id]: generateNodeId() });
        return/*nothing left to do*/;
      } /* else -- add to seen ids */

      seenIds.add(id);
    });

    return tr/*updated*/;
  }
}

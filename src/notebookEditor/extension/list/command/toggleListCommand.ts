import { Attrs, Fragment, NodeRange, NodeType, Slice } from 'prosemirror-model';
import { Command, EditorState, Transaction } from 'prosemirror-state';
import { canSplit, findWrapping, ReplaceAroundStep } from 'prosemirror-transform';

import { findParentNodeClosestToPos, AbstractDocumentUpdate, Attributes, NodeName } from 'common';

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
          { $from, $to } = selection;

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
      let outerRange = blockRange/*default*/,
          performJoin = false/*default*/;

      if(blockRange.depth >= 2/*nested range*/
        && $from.node(blockRange.depth-1/*depth of ancestor*/).type.compatibleContent(listItemType)
        && blockRange.startIndex === 0/*first direct child*/
      ) {
        if($from.index(blockRange.depth - 1/*depth of ancestor*/) === 0) return false/*at the top of the List*/;

        let $insertionPos = editorState.doc.resolve(blockRange.start - 2/*account for start and end of range*/);
        outerRange = new NodeRange($insertionPos, $insertionPos, blockRange.depth);

        if(blockRange.endIndex < blockRange.parent.childCount) {
          blockRange = new NodeRange($from, editorState.doc.resolve($to.end(blockRange.depth)), blockRange.depth);
        } /* else -- the endIndex is not less than the childCount of the parent */
        performJoin = true;
      }

      const listWrapping = findWrapping(outerRange, listType, this.attrs, blockRange);
      if(!listWrapping) return false/*no valid wrapping was found*/;
      tr = applyListWrapping(tr, blockRange, listWrapping, performJoin, listType).scrollIntoView();
    }

    return tr/*updated*/;
  }
}

const applyListWrapping = (tr: Transaction, nodeRange: NodeRange, wrapperDefinitions: { type: NodeType; attrs?: Attrs | null; }[], performJoinBefore: boolean, listType: NodeType) => {
  let newContent = Fragment.empty/*default*/;
  for(let i = wrapperDefinitions.length - 1; i >= 0; i--) {
    newContent = Fragment.from(wrapperDefinitions[i].type.create(wrapperDefinitions[i].attrs, newContent));
  }

  tr.step(new ReplaceAroundStep(nodeRange.start - (performJoinBefore ? 2/*account for start and end*/ : 0/*do not account*/), nodeRange.end, nodeRange.start, nodeRange.end,
                                new Slice(newContent, 0/*use full Slice*/, 0/*use full Slice*/), wrapperDefinitions.length, true/*maintain structure*/));

  let listWrapperAmount = 0;
  for(let i = 0; i < wrapperDefinitions.length; i++) {
    if(wrapperDefinitions[i].type === listType) {
      listWrapperAmount = i + 1/*account for indexing*/;
    } /* else -- ignore */
  }

  const splitDepth = wrapperDefinitions.length - listWrapperAmount;
  let splitPosition = nodeRange.start + wrapperDefinitions.length - (performJoinBefore ? 2/*account for start and end*/ : 0/*do not account*/);

  const { parent: nodeRangeParent } = nodeRange;
  for(let nodeRangeIndex = nodeRange.startIndex, nodeRangeEndIndex = nodeRange.endIndex, firstIteration = true/*default*/; nodeRangeIndex < nodeRangeEndIndex; nodeRangeIndex++, firstIteration = false/*by definition*/) {
    if(!firstIteration && canSplit(tr.doc, splitPosition, splitDepth)) {
      tr.split(splitPosition, splitDepth);
      splitPosition += (2 * splitDepth);
    } /* else -- not the firstIteration or cannot split at splitPosition with splitDepth */

    splitPosition += nodeRangeParent.child(nodeRangeIndex).nodeSize;
  }

  return tr/*modified*/;
};

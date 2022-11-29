import { InputRule } from 'prosemirror-inputrules';
import { findWrapping, canJoin } from 'prosemirror-transform';

import { AttributeType, isListNode, NodeName } from 'common';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
const bulletListRegEx = /^\s*([-+*])\s$/;
const orderedListRegex = /^(\d+)\.\s$/;

// == Input Rule ==================================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rulebuilders.ts

// NOTE: not using default wrappingInputRule since the specific check for the
//       type of the parent where the match occurs must be performed
export const createListWrapInputRule = (nodeName: NodeName.BULLET_LIST | NodeName.ORDERED_LIST) =>
  new InputRule(nodeName === NodeName.BULLET_LIST ? bulletListRegEx : orderedListRegex, (state, match, start, end) => {
    const listType = state.schema.nodes[nodeName],
          attrs = nodeName === NodeName.BULLET_LIST
            ? {/*no attrs for BulletList*/}
            : { [AttributeType.StartValue]: Number(match[1/*the typed number*/]) };
    const { tr } = state;

    // this is the specific check to be performed
    const maybeList = tr.selection.$from.node(-2/*ancestor depth, may be a List*/);
    if(maybeList && isListNode(maybeList)) return null/*do not allow inside a List*/;

    tr.delete(start, end);
    let $start = tr.doc.resolve(start),
        blockRange = $start.blockRange();
    if(!blockRange) return null/*do not apply rule*/;

    const wrapping = blockRange && findWrapping(blockRange, listType, attrs);
    if(!wrapping) return null/*do not apply rule*/;
    tr.wrap(blockRange, wrapping);

    const posBeforeStart = start - 1;
    const { nodeBefore } = tr.doc.resolve(posBeforeStart);
    if(nodeBefore && nodeBefore.type === listType && canJoin(tr.doc, posBeforeStart)) {
      let shouldJoin = true/*default*/;
      if(nodeName === NodeName.ORDERED_LIST) {
        shouldJoin = nodeBefore.childCount + nodeBefore.attrs[AttributeType.StartValue] === Number(match[1/*the typed number*/]);
      } /* else -- no special check */

      if(shouldJoin) {
        tr.join(posBeforeStart);
      } /* else -- do not join */
    } /* else -- cannot join */

    return tr/*updated*/;
  });

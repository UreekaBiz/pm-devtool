import { InputRule } from './InputRule';
import { canJoin, findWrapping } from 'prosemirror-transform';
import { NodeType, Node, Attrs } from 'prosemirror-model';

// ********************************************************************************
/**
 * build an input rule for automatically wrapping a TextBlock when a
 * given string is typed. The {@link RegExp} argument is
 * directly passed through to the {@link InputRule} constructor
 *
 * {@link NodeType} is the type of node to wrap in. If it needs attributes,
 * they can be passed directly, of a function that will compute them from
 * the {@link RegExp} match can be passed
 *
 * by default, if there's a Node with the same type above the newly
 * wrapped Node, the rule will try to join those
 * two Node. A join predicate can be passed, which takes a regular
 * expression to match and the Node before the wrapped Node, and can
 * return a boolean to indicate whether a join should happen
 */
export const createWrappingInputRule = (regexp: RegExp, nodeType: NodeType, getAttrs: Attrs | null | ((matches: RegExpMatchArray) => Attrs | null) = null/*default no attrs*/, joinPredicate?: (match: RegExpMatchArray, node: Node) => boolean) =>
  new InputRule(regexp, (state, match, start, end) => {
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    const tr = state.tr.delete(start, end);

    const $start = tr.doc.resolve(start);
    const range = $start.blockRange();
    const wrapping = range && findWrapping(range, nodeType, attrs);
    if(!wrapping) return null/*no valid wrapping was found*/;

    tr.wrap(range, wrapping);
    const { nodeBefore: nodeBeforeStartPos } = tr.doc.resolve(start - 1);

    if(nodeBeforeStartPos
      && nodeBeforeStartPos.type === nodeType
      && canJoin(tr.doc, start - 1)
      && (!joinPredicate || joinPredicate(match, nodeBeforeStartPos))) {
        tr.join(start - 1);
    } /* else -- there is no nodeBeforeStartPos, its type does not match the given NodeType, or cannot join it or should not join it  */

    return tr/*modified*/;
  });


/**
 * Build an InputRule that changes the type of a TextBlock when the
 * matched text is typed into it. The optional `getAttrs` parameter
 * can be used to compute the new Node's attributes,
 * and works the same as in {@link createWrappingInputRule}
 */
export const textblockTypeInputRule = (regexp: RegExp, nodeType: NodeType, getAttrs: Attrs | null | ((match: RegExpMatchArray) => Attrs | null) = null/*default no attrs*/) =>
  new InputRule(regexp, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;

    if(!$start.node(-1/*grand parent*/).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) return null/*cannot change the type of the TextBlock*/;

    return state.tr.delete(start, end).setBlockType(start, start, nodeType, attrs);
  });

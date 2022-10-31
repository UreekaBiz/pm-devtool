import { canJoin, findWrapping } from 'prosemirror-transform';
import { NodeType, Node, Attrs, MarkType } from 'prosemirror-model';

import { getMarksBetween } from 'common';

import { InputRule } from './InputRule';

// ********************************************************************************
// == Wrap ========================================================================
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


// == TextBlock ===================================================================
/**
 * Build an InputRule that changes the type of a TextBlock when the
 * matched text is typed into it. The optional `getAttrs` parameter
 * can be used to compute the new Node's attributes,
 * and works the same as in {@link createWrappingInputRule}
 */
export const createTextblockTypeInputRule = (regexp: RegExp, nodeType: NodeType, getAttrs: Attrs | null | ((match: RegExpMatchArray) => Attrs | null) = null/*default no attrs*/) =>
  new InputRule(regexp, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;

    if(!$start.node(-1/*grand parent*/).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) return null/*cannot change the type of the TextBlock*/;

    return state.tr.delete(start, end).setBlockType(start, start, nodeType, attrs);
  });


// == Mark ========================================================================
/** build an Input Rule that adds a Mark when the matched text is typed into it */
export const createMarkInputRule = (regexp: RegExp, markType: MarkType, getAttrs: Attrs | null | ((matches: RegExpMatchArray) => Attrs | null) = null/*default no attrs*/) =>
new InputRule(regexp, (state, match, start, end) => {
  const attributes = getAttrs instanceof Function ? getAttrs(match) : getAttrs;

  const { tr } = state;
  const captureGroup = match[match.length - 1];
  const fullMatch = match[0/*all text*/];

  if(!captureGroup) return null/*no space into which apply Mark*/;

  const startSpaces = fullMatch.search(/\S/);
  const textStart = start + fullMatch.indexOf(captureGroup);
  const textEnd = textStart + captureGroup.length;

  const excludedMarks = getMarksBetween(start, end, state.doc).filter(item => {
    // NOTE: this property does exist on the MarkType
    // @ts-ignore
    const excluded = item.mark.type.excluded as MarkType[];

    return excluded.find(type => type === markType && type !== item.mark.type);
  }).filter(item => item.to > textStart);
  if(excludedMarks.length) return null/*there is a Mark that excludes the given MarkType in the range of the match*/;

  if(textEnd < end) {
    tr.delete(textEnd, end);
  } /* else -- Text does not end before the match end */

  if(textStart > start) {
    tr.delete(start + startSpaces, textStart);
  } /* else -- Text does not start after the match start */

  const markEnd = start + startSpaces + captureGroup.length;
  tr.addMark(start + startSpaces, markEnd, markType.create(attributes || {/*no attrs*/ }))
    .removeStoredMark(markType);

  return tr/*modified*/;
});



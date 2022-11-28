import { InputRule } from 'prosemirror-inputrules';
import { NodeType, Attrs, MarkType } from 'prosemirror-model';

import { getMarksInRange } from 'common';

// ********************************************************************************
// == Node ========================================================================
export const createNodeInputRule = (regexp: RegExp, nodeType: NodeType, getAttrs: Attrs | null | ((matches: RegExpMatchArray) => Attrs | null) = null/*default no attrs*/) =>
  new InputRule(regexp, (state, match, start, end) => {
    const attributes = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    const { tr } = state;

    if(match[1/*index*/]) {
      const offset = match[0/*text*/].lastIndexOf(match[1/*index*/]);
      let matchStart = start + offset;

      if(matchStart > end) { matchStart = end; }
      else { end = matchStart + match[1/*index*/].length; }

      // insert last typed character
      const lastChar = match[0][match[0].length - 1];
      tr.insertText(lastChar, start + match[0].length - 1);

      // insert Node
      tr.replaceWith(matchStart, end, nodeType.create(attributes));
    } else if(match[0/*matched text*/]) {
      tr.replaceWith(start, end, nodeType.create(attributes));
    }

    return tr;
  });

// == Mark ========================================================================
/** build an Input Rule that adds a Mark when the matched text is typed into it */
export const createMarkInputRule = (regexp: RegExp, markType: MarkType, getAttrs: Attrs | null | ((matches: RegExpMatchArray) => Attrs | null) = null/*default no attrs*/) =>
new InputRule(regexp, (state, match, start, end) => {
  const attributes = getAttrs instanceof Function ? getAttrs(match) : getAttrs;

  const { tr } = state;
  const captureGroup = match[match.length - 1],
        fullMatch = match[0/*all text*/];

  if(!captureGroup) return null/*no space into which apply Mark*/;

  const startSpaces = fullMatch.search(/\S/),
        textStart = start + fullMatch.indexOf(captureGroup),
        textEnd = textStart + captureGroup.length;

  const excludedMarks = getMarksInRange(state.doc, { from: start, to: end }).filter(item => {
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



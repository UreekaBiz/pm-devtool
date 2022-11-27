import { MarkType } from 'prosemirror-model';

import { getMarksInRange } from 'common';

import { PasteRule, PasteRuleMatcher } from './PasteRule';

// ********************************************************************************
// == Type ========================================================================
type MarkPasteRuleGetAttrsType = Record<string, any> | ((match: RegExpMatchArray) => Record<string, any>) | false | null;

// == Mark ========================================================================
/**
 * Build an paste rule that adds a Mark when the
 * matched Text is pasted
 */
export const createMarkPasteRule = (matcher: PasteRuleMatcher, markType: MarkType, getAttrs: MarkPasteRuleGetAttrsType = {/*default no attrs*/}) =>
  new PasteRule(matcher, (state, match, start, end) => {
    const attributes = getAttrs instanceof Function ? getAttrs(match) : getAttrs;

    const { tr } = state;
    const captureGroup = match[match.length - 1],
          fullMatch = match[0/*matched Text*/];

    if(captureGroup) {
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

      tr.addMark(start + startSpaces, markEnd, markType.create(attributes || {/*no attrs*/ }));
      tr.removeStoredMark(markType);
    } /* else -- no capture group */

    return tr/*default*/;
  });

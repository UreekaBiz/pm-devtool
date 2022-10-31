import { ProseMirrorInputRule } from './ProseMirrorInputRule';

// ********************************************************************************
// REF: https://raw.githubusercontent.com/ProseMirror/prosemirror-inputrules/master/src/rules.ts

// convert double dashes to an emdash
export const emDashProseMirrorInputRule = new ProseMirrorInputRule(/--$/, "—");

// convert three dots to an ellipsis character
export const ellipsisProseMirrorInputRule = new ProseMirrorInputRule(/\.\.\.$/, "…");

// smart opening double quotes
export const openDoubleQuoteProseMirrorInputRule = new ProseMirrorInputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“");

// smart closing double quotes
export const closeDoubleQuoteProseMirrorInputRule = new ProseMirrorInputRule(/"$/, "”");

// smart opening single quotes
export const openSingleQuoteProseMirrorInputRule = new ProseMirrorInputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘");

// smart closing single quotes
export const closeSingleQuoteProseMirrorInputRule = new ProseMirrorInputRule(/'$/, "’");

// smart quote-related input rules
export const smartQuoteProseMirrorInputRules: readonly ProseMirrorInputRule[] = [openDoubleQuoteProseMirrorInputRule, closeDoubleQuoteProseMirrorInputRule, openSingleQuoteProseMirrorInputRule, closeSingleQuoteProseMirrorInputRule];

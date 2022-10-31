import { InputRule } from './InputRule';

// ********************************************************************************
// REF: https://raw.githubusercontent.com/ProseMirror/prosemirror-inputrules/master/src/rules.ts

// convert double dashes to an emdash
export const emDashInputRule = new InputRule(/--$/, "—");

// convert three dots to an ellipsis character
export const ellipsisInputRule = new InputRule(/\.\.\.$/, "…");

// smart opening double quotes
export const openDoubleQuoteInputRule = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“");

// smart closing double quotes
export const closeDoubleQuoteInputRule = new InputRule(/"$/, "”");

// smart opening single quotes
export const openSingleQuoteInputRule = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘");

// smart closing single quotes
export const closeSingleQuoteInputRule = new InputRule(/'$/, "’");

// smart quote-related input rules
export const smartQuoteInputRules: readonly InputRule[] = [openDoubleQuoteInputRule, closeDoubleQuoteInputRule, openSingleQuoteInputRule, closeSingleQuoteInputRule];

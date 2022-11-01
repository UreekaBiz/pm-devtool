import { InputRule } from './InputRule';

// ********************************************************************************
// REF: https://raw.githubusercontent.com/ProseMirror/prosemirror-inputrules/master/src/rules.ts

// -- General ---------------------------------------------------------------------
// convert double dashes to an emdash
const emDashInputRule = new InputRule(/--$/, "—");

// convert three dots to an ellipsis character
const ellipsisInputRule = new InputRule(/\.\.\.$/, "…");

// -- Quote -----------------------------------------------------------------------
// smart opening double quotes
const openDoubleQuoteInputRule = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“");

// smart closing double quotes
const closeDoubleQuoteInputRule = new InputRule(/"$/, "”");

// smart opening single quotes
const openSingleQuoteInputRule = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘");

// smart closing single quotes
const closeSingleQuoteInputRule = new InputRule(/'$/, "’");

// smart quote-related Input ]Rules
const smartQuoteInputRules = [openDoubleQuoteInputRule, closeDoubleQuoteInputRule, openSingleQuoteInputRule, closeSingleQuoteInputRule];

// -- Arrow -----------------------------------------------------------------------
const arrowInputRules: InputRule[] = [new InputRule(/<-$/, '←'), new InputRule(/->$/, '→')];

// a set of default Input Rules
export const defaultInputRules: readonly InputRule[] = [emDashInputRule, ellipsisInputRule, ...smartQuoteInputRules, ...arrowInputRules];

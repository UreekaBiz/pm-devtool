import { InputRule } from 'prosemirror-inputrules';

// ********************************************************************************
// == Arrow =======================================================================
const arrowInputRules: InputRule[] = [new InputRule(/<-$/, '←'), new InputRule(/->$/, '→')];

// a set of default Input Rules
export const defaultInputRules: readonly InputRule[] = [...arrowInputRules];

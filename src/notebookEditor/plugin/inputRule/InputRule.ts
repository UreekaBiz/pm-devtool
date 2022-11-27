import { EditorState, Plugin, Transaction, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

// ********************************************************************************
// == Constant ====================================================================
// the maximum length for the match of an InputRule
const MAX_MATCH = 500;

// used by the undoInputRuleCommand to check if the the effects of an InputRule
// should be undone
export const IS_INPUT_RULE_PLUGIN = 'isInputRulePlugin';

// == Type ========================================================================
export type InputRulePluginState = { transaction: Transaction; from: number; to: number; text: string; } | null;
type InputRuleFunctionHandlerType = (state: EditorState, match: RegExpMatchArray, start: number, end: number) => Transaction | null;

// == Class =======================================================================
/**
 * InputRules are regular expressions describing a piece of Text that, when
 * typed, causes something to happen in the Editor
 */
export class InputRule {
  /**
   * the handler for the InputRule. it can be a string, in which case the
   * matched Text or the first matched group in the given {@link RegExp}
   * is replaced by that string, or it can be a function, which will be called
   * with the match array produced by [`RegExp.exec`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec),
   * as well as the start and end of the matched range, and which can
   * return a {@link Transaction} that describes the rule's effect,
   * or null to indicate the input was not handled
   */
  public readonly handler: string | InputRuleFunctionHandlerType;

  /** the {@link RegExp} that checks the typed Text */
  public readonly match: RegExp;

  constructor(match: RegExp, handler: string | InputRuleFunctionHandlerType) {
    this.match = match;
    this.handler = typeof handler == 'string' ? stringHandler(handler) : handler;
  }
}

// == Plugin ======================================================================
/**
 * create an InputRule plugin. When enabled, it will cause Text input
 * that matches any of the given rules to trigger the rule's action
 * */
 export const inputRulesPlugin = ({ rules }: { rules: readonly InputRule[]; }) => {
  const plugin: Plugin<InputRulePluginState> = new Plugin<InputRulePluginState>({
    // -- State -------------------------------------------------------------------
    state: {
      init() { return null/*default no state*/; },
      apply(this: typeof plugin, tr, previousState) {
        const scheduledInsertTextTransaction = tr.getMeta(this);

        if(scheduledInsertTextTransaction) {
          return scheduledInsertTextTransaction;
        } /* else -- no inputRules triggered recently */

        return tr.selectionSet || tr.docChanged ? null/*default*/ : previousState;
      },
    },

    // -- Props -------------------------------------------------------------------
    // NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-inputrules/blob/d60b7920d040e9b18ee893bad4213180fedc47f5/src/inputrules.ts
    props: {
      // ensure that the inputRule applies on a given textInput if it matches
      handleTextInput: (view: EditorView, from: number, to: number, text: string) => {
        return executeInputRule(view, from, to, text, rules, plugin);
      },

      // ensure that the inputRules still apply at the end of a composition event
      handleDOMEvents: {
        compositionend: (view: EditorView) => {
          let executed = false/*default*/;
          setTimeout(() => {
            let { $cursor } = view.state.selection as TextSelection/*specifically looking for $cursor*/;
            if($cursor) {
              executeInputRule(view, $cursor.pos, $cursor.pos, '', rules, plugin);
              executed = true/*executed*/;
            } /* else -- not a TextSelection, do nothing */
          });

          return executed/*default*/;
        },
      },

      // NOTE: since this property is not in the PluginSpec, but it is used by the
      //       undoInputRule Command, it must be added
      // @ts-ignore
      [IS_INPUT_RULE_PLUGIN]: true,
    },
  });

  return plugin;
};

// == Util ========================================================================
/**
 * returns a function that inserts the given string when called from within
 * an InputRule that does not define a handler
 */
export const stringHandler = (replaceWithString: string) =>
  (state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
    let insertedText = replaceWithString;

    if(match[1/*index*/]) {
      let offset = match[0/*text to replace*/].lastIndexOf(match[1]);
      insertedText += match[0/*text to replace*/].slice(offset + match[1].length);
      start += offset;

      let cutOffLength = start - end;
      if(cutOffLength > 0) {
        insertedText = match[0/*text to replace*/].slice(offset - cutOffLength, offset) + insertedText;
        start = end;
      } /* else -- do not perform cut */
    } /* else -- no need to modify insertedText */

    return state.tr.insertText(insertedText, start, end);
  };


// schedules the execution of an InputRule by setting Metadata on the state of the
// Transaction of the state of the given View, when the Text typed by the
// User is matched by one of the Rules of this Plugin
/**
 * schedules the execution of an InputRule by setting Metadata on the state of the
 * {@link Transaction} of the {@link EditorState} of the given {@link EditorView},
 * when the Text typed by the User is matched by one of the Rules of the Plugin
 */
const executeInputRule = (view: EditorView, from: number, to: number, text: string, rules: readonly InputRule[], plugin: Plugin) => {
  if(view.composing) return false/*do not trigger inputRules during composition events */;

  const state = view.state;
  const $from = state.doc.resolve(from);
  const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset, undefined/*no block separator*/, '\ufffc'/*insert for every non Leaf Node*/) + text;

  for(let i = 0; i < rules.length; i++) {
    const match = rules[i].match.exec(textBefore);
    const { handler } = rules[i];

    const tr = match &&  typeof handler === 'function' &&  handler(state, match, from - (match[0].length - text.length), to);
    if(!tr) continue/*this Rule does not specify a handler function or it did not match*/;

    view.dispatch(tr.setMeta(plugin, { transaction: tr, from, to, text }));
    return true/*one inputRule was scheduled*/;
  }

  return false/*no inputRules were scheduled*/;
};

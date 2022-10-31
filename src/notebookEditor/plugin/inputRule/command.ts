import { Command, EditorState, Transaction } from 'prosemirror-state';

import { AbstractDocumentUpdate } from 'common';

import { InputRulePluginState, IS_INPUT_RULE_PLUGIN } from './InputRule';

// ********************************************************************************
// REF: https://github.com/ProseMirror/prosemirror-inputrules/blob/d60b7920d040e9b18ee893bad4213180fedc47f5/src/inputrules.ts

/**
 * {@link Command} to undo the effects of an InputRule, if applying
 * such a rule was the last thing the User did
 */
export const undoInputRuleCommand: Command = (state, dispatch) =>
  AbstractDocumentUpdate.execute(new UndoInputRuleDocumentUpdate().update(state, state.tr), dispatch);
export class UndoInputRuleDocumentUpdate implements AbstractDocumentUpdate {
  public constructor() {/*nothing additional*/ }

  /**
   * modify the given Transaction such that the effects of an InputRule
   * are undone if applying said rule was the last thing the User did
   */
  public update(editorState: EditorState, tr: Transaction) {
    const { plugins } = editorState;

    for(let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];

      // @ts-ignore (SEE: InputRule.ts)
      const isInputRulePlugin: boolean = plugin.spec.props[IS_INPUT_RULE_PLUGIN] ?? false/*default to not an InputRule Plugin*/;
      if(isInputRulePlugin) {
          const inputRulePluginState: InputRulePluginState = plugin.getState(editorState);
          if(!inputRulePluginState) return false/*no Plugin state, nothing to do*/;

          const transactionToUndo = inputRulePluginState.transaction;
          for(let j = transactionToUndo.steps.length - 1; j >= 0; j--) {
            tr.step(transactionToUndo.steps[j].invert(transactionToUndo.docs[j]));
          }

          if(inputRulePluginState.text) {
            const marks = tr.doc.resolve(inputRulePluginState.from).marks();
            tr.replaceWith(inputRulePluginState.from, inputRulePluginState.to, editorState.schema.text(inputRulePluginState.text, marks));
          } else {
            tr.delete(inputRulePluginState.from, inputRulePluginState.to);
          }

        return tr/*updated*/;
      }
    }

    return false/*default to not undoing the InputRule*/;
  }
}

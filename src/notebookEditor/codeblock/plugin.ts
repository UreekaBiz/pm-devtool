import { Plugin, PluginKey } from 'prosemirror-state';

import { NoPluginState } from 'notebookEditor/model';
import { Editor } from 'notebookEditor/editor';

import { codeBlockOnTransaction } from './transaction';

// ********************************************************************************
/**
 * check to see if a Transaction adds or removes a Heading or a CodeBlock, or if
 * it changes the level of a Heading. Recompute the necessary CodeBlock visual IDs
 * if this is the case
 */
// == Constant ====================================================================
export const codeBlockPluginKey = new PluginKey<NoPluginState>('codeBlockPluginKey');

// == Plugin ======================================================================
export const codeBlockPlugin = (editor: Editor) => new Plugin<NoPluginState>({
  // -- Setup -------------------------------------------------------------------
  key: codeBlockPluginKey,

  // -- Transaction -------------------------------------------------------------
  appendTransaction(transactions, oldState, newState) {
    const { tr } = newState;
    codeBlockOnTransaction(editor, tr);
    return tr/*not modified*/;
  },
});

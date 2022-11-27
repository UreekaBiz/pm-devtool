import { Plugin } from 'prosemirror-state';

import { NoPluginState } from 'notebookEditor/model/type';

import { checkAndLiftChangedLists, checkAndMergeListAtPos } from './util';

// ********************************************************************************
// == Plugin ======================================================================
export const fixListsPlugin = () => new Plugin<NoPluginState>({
  // -- Transaction -------------------------------------------------------------
  // ensure that Lists are merged and joined if possible
  // (SEE: checkAndMergeList), prevent any ListItems from
  // being loose within a List (SEE: checkAndLiftChangedLists)
  appendTransaction(transactions, oldState, newState) {
    if(oldState.doc === newState.doc) return/*no changes*/;

    const { tr } = newState;

    const wereListsLifted = checkAndLiftChangedLists(tr);
    let wereListsMerged = checkAndMergeListAtPos(tr, tr.selection.$from.before(1/*direct child of Doc depth*/));
    if(!wereListsMerged) {
      wereListsMerged = checkAndMergeListAtPos(tr, tr.selection.$from.after(1/*direct child of Doc depth*/));
    } /* else -- already merged */

    if(wereListsMerged || wereListsLifted) {
      return tr/*modified*/;
    } /* else -- no Lists were merged */

    return/*nothing to do*/;
  },
});

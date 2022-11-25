import { Plugin } from 'prosemirror-state';

import { NoPluginState } from 'notebookEditor/model/type';

import { checkAndLiftChangedLists, checkAndMergeListAtPos } from './command';

// ********************************************************************************
// == Plugin ======================================================================
export const listItemPlugin = () => new Plugin<NoPluginState>({
  // -- Transaction -------------------------------------------------------------
  // ensure that Lists are merged and joined if possible
  // (SEE: checkAndMergeList), prevent any ListItems from
  // being loose within a List (SEE: checkAndLiftChangedLists)
  appendTransaction(transactions, oldState, newState) {
    const { tr } = newState;

    let wereListsMerged = checkAndMergeListAtPos(tr, tr.selection.$from.before(1/*direct child of Doc depth*/));
    if(!wereListsMerged) {
      wereListsMerged = checkAndMergeListAtPos(tr, tr.selection.$from.after(1/*direct child of Doc depth*/));
    } /* else -- already merged */
    const wereListsLifted = checkAndLiftChangedLists(transactions, oldState, tr);

    if(wereListsMerged || wereListsLifted) {
      return tr/*modified*/;
    } /* else -- no Lists were merged */

    return/*nothing to do*/;
  },
});

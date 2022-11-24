import { Plugin } from 'prosemirror-state';

import { getListItemNodeType } from 'common';

import { NoPluginState } from 'notebookEditor/model/type';

import { checkAndLiftChangedLists, checkAndMergeListAtPos } from './command';

// ********************************************************************************
// == Plugin ======================================================================
export const listItemPlugin = () => new Plugin<NoPluginState>({
  // -- Transaction -------------------------------------------------------------
  // ensure that Lists are merged and joined if possible
  // (SEE: checkAndMergeList), and that there are no invalid ListItems
  // (SEE: checkAndLiftChangedLists)
  appendTransaction(transactions, oldState, newState) {
    const { tr } = newState;

    const wereListsMerged = checkAndMergeListAtPos(getListItemNodeType(newState.schema), tr, tr.selection.$from.after(1/*direct child of Doc depth*/)),
          wereListsLifted = checkAndLiftChangedLists(transactions, oldState, tr);

    if(wereListsMerged || wereListsLifted) {
      return tr/*modified*/;
    } /* else -- no Lists were merged */

    return/*nothing to do*/;
  },
});

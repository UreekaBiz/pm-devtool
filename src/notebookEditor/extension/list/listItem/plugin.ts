import { Plugin } from 'prosemirror-state';

import { getListItemNodeType } from 'common';

import { NoPluginState } from 'notebookEditor/model/type';

import { checkAndMergeListAtPos } from './command';

// ********************************************************************************
// == Plugin ======================================================================
export const listItemPlugin = () => new Plugin<NoPluginState>({
  // -- Transaction -------------------------------------------------------------
  // ensure that Lists are merged and joined if possible
  // (SEE: checkAndMergeList)
  appendTransaction(transactions, oldState, newState) {
    const { tr } = newState;

    const wereListsMerged = checkAndMergeListAtPos(getListItemNodeType(newState.schema), tr, tr.selection.$from.after(1/*direct child of Doc depth*/));

    if(wereListsMerged) {
      return tr/*modified*/;
    } /* else -- no Lists were merged */

    return/*nothing to do*/;
  },
});

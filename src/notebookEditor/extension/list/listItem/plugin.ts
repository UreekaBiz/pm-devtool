import { Plugin, PluginKey } from 'prosemirror-state';

import { NoPluginState } from 'notebookEditor/model/type';

import { checkAndMergeListAtPos } from './command/util';

// ********************************************************************************
// == Plugin ======================================================================
export const listItemPlugin = () => new Plugin<NoPluginState>({
  // -- Definition --------------------------------------------------------------
  key: new PluginKey('listItemPluginKey'),

  // -- Transaction -------------------------------------------------------------
  // ensure that Lists are merged and joined if possible (SEE: checkAndMergeList)
  appendTransaction(transactions, oldState, newState) {
    if(oldState.doc === newState.doc) return/*no changes*/;

    const { tr } = newState;

    let wereListsMerged = checkAndMergeListAtPos(tr, tr.selection.$from.before(1/*direct child of Doc depth*/));
    if(!wereListsMerged) {
      wereListsMerged = checkAndMergeListAtPos(tr, tr.selection.$from.after(1/*direct child of Doc depth*/));
    } /* else -- already merged */

    if(wereListsMerged) {
      return tr;
    } /* else -- no Lists were merged */

    return/*nothing to do*/;
  },
});


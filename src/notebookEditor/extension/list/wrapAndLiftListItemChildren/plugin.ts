import { Plugin, PluginKey } from 'prosemirror-state';

import { NoPluginState } from 'notebookEditor/model/type';

import { wrapAndLiftListItemChildren } from './util';

// ********************************************************************************
// == Plugin ======================================================================
export const wrapAndLiftListItemChildrenPlugin = () => new Plugin<NoPluginState>({
  // -- Definition --------------------------------------------------------------
  key: new PluginKey<NoPluginState>('wrapAndLiftListItemChildrenPluginKey'),

  // -- Transaction -------------------------------------------------------------
  // prevent any ListItems from having loose children inside of them
  appendTransaction(transactions, oldState, newState) {
    if(oldState.doc === newState.doc) return/*no changes*/;

    const { tr } = newState;

    const wereChildrenWrappedAndLifted = wrapAndLiftListItemChildren(tr);
    if(wereChildrenWrappedAndLifted) {
      return tr/*modified*/;
    } /* else -- no ListItem children were wrapped and lifted */

    return/*nothing to do*/;
  },
});

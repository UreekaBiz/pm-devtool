import { Plugin, PluginKey } from 'prosemirror-state';

import { isRectangleAttributes, NotebookSchemaType, NodeName } from 'common';

import { NoPluginState } from 'notebookEditor/model/type';

import { insertAndSelectRectangle } from '../command';

// ********************************************************************************
// == Function ====================================================================
const shapePasteKey = new PluginKey<NoPluginState, NotebookSchemaType>('shapePaste');
export const shapePaste = () => {
  let plugin = new Plugin<NoPluginState, NotebookSchemaType>({
    // -- Setup -------------------------------------------------------------------
    key: shapePasteKey,

    // -- State -------------------------------------------------------------------
    state: {
      init(_, state) { return new NoPluginState(); },
      apply(transaction, thisPluginState, oldState, newState) { return thisPluginState.apply(transaction, thisPluginState, oldState, newState); },
    },

    // -- Props -------------------------------------------------------------------
    props: {
      handlePaste(view, event, slice) {/*when this returns true, paste is manually handled*/
        if(slice.size !== 1/*slices can be of size 0*/) return false;

        const pastedNode = slice.content.child(0/*guaranteed to exist by above check*/);
        if(pastedNode.type.name !== NodeName.RECTANGLE || !isRectangleAttributes(pastedNode.attrs)) return false;
        /* else -- pasting a rectangle */

        const { state, dispatch } = view,
              { tr } = state;
        return insertAndSelectRectangle(state, dispatch, tr, pastedNode.attrs);
      },
    },
  });

  return plugin;
};

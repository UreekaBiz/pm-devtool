import { Plugin, PluginKey } from 'prosemirror-state';

import { NotebookSchemaType } from 'common';
import { NoPluginState } from 'notebookEditor/model/type';

import { preventDefaults } from '../util';

// ********************************************************************************
// == Function ====================================================================
// Prevents ProseMirror from handling any keydown events while a shape is being
// created. (SEE: CreateShapeTool.ts)
export const shapeCreateKey = new PluginKey<NoPluginState, NotebookSchemaType>('shapeCreate');
export const shapeCreatePlugin = () => {
  let plugin = new Plugin<NoPluginState, NotebookSchemaType>({
    // -- Setup -------------------------------------------------------------------
    key: shapeCreateKey,

    // -- State -------------------------------------------------------------------
    state: {
      init(_, state) { return new NoPluginState(); },
      apply(transaction, thisPluginState, oldState, newState) { return thisPluginState.apply(transaction, thisPluginState, oldState, newState); },
    },

    props: {
      handleDOMEvents: { keydown(view, event) { preventDefaults(event); return true; } },
    },
  });

  return plugin;
};

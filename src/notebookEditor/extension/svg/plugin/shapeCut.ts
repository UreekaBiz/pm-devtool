import { isNodeSelection } from '@tiptap/core';
import {  NodeSelection, Plugin, PluginKey } from 'prosemirror-state';

import { NotebookSchemaType, NodeName } from 'common';
import { NoPluginState } from 'notebookEditor/model/type';

// ********************************************************************************
// == Function ====================================================================
const shapeCutKey = new PluginKey<NoPluginState, NotebookSchemaType>('shapeCut');
export const shapeCut = () => {
  let plugin = new Plugin<NoPluginState, NotebookSchemaType>({
    // -- Setup -------------------------------------------------------------------
    key: shapeCutKey,

    // -- State -------------------------------------------------------------------
    state: {
      init(_, state) { return new NoPluginState(); },
      apply(transaction, thisPluginState, oldState, newState) { return thisPluginState.apply(transaction, thisPluginState, oldState, newState); },
    },

    // -- Transaction -------------------------------------------------------------
    // Selects the parentSVG when a shape is cut from the SVG node
    appendTransaction(transactions, oldState, newState) {
      if(newState.doc === oldState.doc) { return/*no changes*/; }

      const prevSelection = oldState.selection;
      const { tr } = newState;
      if(!isNodeSelection(prevSelection) || !(prevSelection.node.type.name === NodeName.RECTANGLE)) return tr;
      /* else -- previous selection was a shape, see if its parent svg still exists */

      const svgParent = prevSelection.$anchor.parent,
            shapeNode = prevSelection.node;

      let parentStillExists = false/*default*/,
          parentPos = 0/* default*/,
          childStillExists = false/*default*/;

      newState.doc.descendants((node, nodePos) => {
        if(node.attrs.id === svgParent.attrs.id) { parentStillExists = true; parentPos = nodePos; }
        if(node.attrs.id === shapeNode.attrs.id) childStillExists = true;
      });
      if(!parentStillExists || childStillExists) return tr;
      /* else -- parent svg still exists, and the shape does not. Select the parent SVG */

      tr.setSelection(new NodeSelection(tr.doc.resolve(parentPos)));
      return tr;
    },
  });

  return plugin;
};

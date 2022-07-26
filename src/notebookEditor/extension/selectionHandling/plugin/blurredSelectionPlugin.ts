import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isNodeSelection, SELECTED_TEXT_CLASS } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { NoPluginState } from 'notebookEditor/model';

// ********************************************************************************
// REF: https://discuss.prosemirror.net/t/add-css-class-to-current-node-or-selected-nodes/1287

// == Plugin ======================================================================
/**
 * applies a BackgroundColor to the current Selection when it is a TextSelection and
 * the EditorView is not focused
 * (SEE: index.css)
 */
export const blurredSelectionPlugin = (editor: Editor) => new Plugin({
  // -- Definition ----------------------------------------------------------------
  key: new PluginKey<NoPluginState>('blurredSelectionPluginKey'),


  // -- Props ---------------------------------------------------------------------
  props: {
    decorations(state: EditorState) {
      if(editor.view.hasFocus()) return undefined/*only show decoration if View is not focused*/;

      const { selection } = state;
      if(isNodeSelection(selection)) return undefined/*do nothing when a Node is selected*/;

      const { empty, from, to } = selection;
      if(empty) return undefined/*nothing to select*/;

      const decorations: Decoration[] = [];
      state.doc.nodesBetween(from, to, (node, pos, parent) => {
        if(node.isText && parent && parent.isTextblock/*parent is not a nested Editor View*/) {
          const nodeStart = pos;
          const nodeEnd = pos + node.nodeSize;

          if(nodeStart <= from) {
            decorations.push(Decoration.inline(from, from + (Math.min(nodeEnd, to) - from), { class: SELECTED_TEXT_CLASS }));
          } else {
            // check must be done backwards
            decorations.push(Decoration.inline(nodeStart, nodeStart + (to - nodeStart), { class: SELECTED_TEXT_CLASS }));
          }
        } /* else -- ignore Node */
      });

      return DecorationSet.create(state.doc, decorations);
    },
  },
});

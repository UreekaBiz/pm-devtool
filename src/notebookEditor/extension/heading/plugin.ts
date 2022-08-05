import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { generateNodeId, isHeadingNode, AttributeType, HeadingAttributes, NotebookSchemaType } from 'common';

import { getSelectedNode } from '../util/node';

// ********************************************************************************
export const HeadingPlugin = () => new Plugin<NotebookSchemaType>({
  // -- Props ---------------------------------------------------------------------
  props: {
    // .. Handler .................................................................
    // When the heading is going to be splitted (i.e. the user press the Enter key)
    // the newly created node must have a new unique id while copying the rest of
    // the attributes.
    handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
      const { state, dispatch } = view;
      const { tr } = state;

      // gets the currently selected node
      const { depth } = state.selection.$anchor;
      const node = getSelectedNode(state, depth/*parent node of text selection*/);

      if(!node || !isHeadingNode(node)) return false/*don't handle -- not a heading*/;

      if(event.key === 'Enter') {
        const newAttrs: HeadingAttributes = { ...node.attrs, [AttributeType.Id]: generateNodeId() };

        // Split the node from the current selection and append the attributes.
        tr.split(state.selection.from, 1, [{ type: node.type, attrs: newAttrs }]);
        dispatch(tr);

        return true/*event handled*/;
      } /* else -- key is not handled */

      return false/*event not handled*/;
    },
  },
});


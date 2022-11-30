import { Plugin, PluginKey } from 'prosemirror-state';

import { NoPluginState } from 'notebookEditor/model';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { DATA_NODE_TYPE, NodeName } from 'common';

// == Constant ====================================================================
const VERTICAL_LIMIT_DISTANCE = 400/*px*/;

// == Plugin ======================================================================
/**
 * ensure that artificial paragraphs get drawn at the end of the Document so that
 * there is space for the User to type without the window being all the way
 * at the bottom
 */
export const bottomOfWindowPlugin = () => {
  let showParagraphDecorations = false/*default*/;
  return new Plugin({
    // -- Definition ----------------------------------------------------------------
    key: new PluginKey<NoPluginState>('bottomOfWindowPluginKey'),

    // -- View ----------------------------------------------------------------------
    view: (view) => {
      return {
        update: (view, prevState) => {
          const { head } = view.state.selection;
          const viewPortRect = view.coordsAtPos(head);

          const { top } = viewPortRect;
          const verticalLimit = document.documentElement.clientHeight - VERTICAL_LIMIT_DISTANCE;

          if(top >= verticalLimit) {
            showParagraphDecorations = true;
          }
        },
      }
    },

    // -- Props ----------------------------------------------------------------------
    props: {
      decorations: (state) => {
        if(showParagraphDecorations) {
          const paragraphToDom = (view: EditorView, getPos: () => number | undefined) => {
            const dom = document.createElement('div');
                   dom.style.border = '1px solid red';
                   dom.setAttribute(DATA_NODE_TYPE, NodeName.PARAGRAPH);
            return dom;
          };
          const paragraphDecoration =
            Decoration.widget(
              state.doc.nodeSize-3/*at the end of the Doc*/,
              paragraphToDom,
              {
                side: 1,
                ignoreSelection: true,
                stopEvent: (event) => true,
              },
            );
          return DecorationSet.create(state.doc, [paragraphDecoration]);
        } else {
          return DecorationSet.empty;
        }
      },
    },
  });
}

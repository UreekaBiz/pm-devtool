import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';

import { isInlineNodeWithContent, NotebookSchemaType } from 'common';

// ********************************************************************************
// == Class =======================================================================
class InlineNodeWithContent {
  constructor(public inBetweenInlineNodes: boolean) {
    this.inBetweenInlineNodes = inBetweenInlineNodes;
  }

  apply(tr: Transaction, thisPluginState: InlineNodeWithContent, oldEditorState: EditorState, newEditorState: EditorState) { /*produce a new plugin state*/
    if(!tr.selection.empty) {
      this.inBetweenInlineNodes = false/*by definition*/;
      return this;
    } /* else -- selection empty */

    const { $anchor } = tr.selection;
    const { nodeBefore, nodeAfter } = $anchor;
    if(nodeBefore && nodeAfter && isInlineNodeWithContent(nodeBefore) && isInlineNodeWithContent(nodeAfter)) {
      this.inBetweenInlineNodes = true;
      return this;
    } /* else -- not in the middle of two inline Nodes with Content */

    this.inBetweenInlineNodes = false;
    return this;
  }
}

// == Plugin ======================================================================
const inlineNodeWithContentKey = new PluginKey<InlineNodeWithContent, NotebookSchemaType>('inlineNodeWithContentKey');
export const InlineNodeWithContentPlugin = () => {
  let composingInput = false;

  const plugin = new Plugin<InlineNodeWithContent, NotebookSchemaType>({
    // -- Setup -------------------------------------------------------------------
    key: inlineNodeWithContentKey,

    // -- State -------------------------------------------------------------------
    state: {
      init(_, state) { return new InlineNodeWithContent(false/*default not in between inline Nodes with Content */); },
      apply(transaction, thisPluginState, oldState, newState) { return thisPluginState.apply(transaction, thisPluginState, oldState, newState); },
    },

    // -- Props -------------------------------------------------------------------
    props: {
      handleDOMEvents: {
        // REF: https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event
        //      ensure that the composingInput flag is set whenever the selection
        //      is between inline Nodes with Content
        compositionstart: (view: EditorView) => {
          const state = getInlineNodeWithContentState(view.state);

          if(state.inBetweenInlineNodes) {
            composingInput = true;
          } /* else -- not in between inline Nodes with Content, let PM handle the event */

          return false/*let PM handle the event*/;
        },

        // REF: https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event
        //      ensure there are no duplicate inputs when the composition event
        //      ends, (i.e. the right input is set, and it is only set once into
        //      the editor)
        compositionend: (view: EditorView, event: CompositionEvent) => {
          try {
            if(composingInput) {
              requestAnimationFrame(() => {
                const state = getInlineNodeWithContentState(view.state);
                if(state.inBetweenInlineNodes) {
                  event.preventDefault();
                  view.dispatch(view.state.tr.insertText(event.data, view.state.selection.from));
                } /* else -- not in between inline Nodes with Content, do nothing */
              });

              return true;
            } /* else -- not composing an input, let PM handle the event */
          } catch(error) {
            console.warn(`Something went wrong while inserting composed input: ${error}`);
          } finally {
            composingInput = false/*default*/;
          }
          return false/*let PM handle the event*/;
        },

        // ensure that the resulting input from a composition gets inserted into
        // the editor correctly
        beforeinput: (view: EditorView, event: InputEvent) => {
          const state = getInlineNodeWithContentState(view.state);
          if(state.inBetweenInlineNodes && event.data && !composingInput) {
            event.preventDefault();
            view.dispatch(view.state.tr.insertText(event.data, view.state.selection.from));

            return true;
          } /* else -- not in between inline Nodes with Content, event has no data, or not composing an input */

          return false/*let PM handle the event*/;
        },
      },

      // add empty span decorations when cursor is in between inline Nodes with
      // Content so that the Cursor does not get displayed incorrectly
      decorations(state: EditorState) {
        const pluginState = getInlineNodeWithContentState(state);
        if(pluginState.inBetweenInlineNodes) {
          const { pos: anchorPos } = state.selection.$anchor;

          const leftSpan = document.createElement('span'),
                leftDecoration = Decoration.widget(anchorPos, leftSpan, { side: -1/*appear before the next decoration*/ });

          const rightSpan = document.createElement('span'),
                rightDecoration = Decoration.widget(anchorPos, rightSpan);

          // make spans non editable right after the view is updated
          setTimeout(() => {
            leftSpan.setAttribute('contenteditable', 'true');
            rightSpan.setAttribute('contenteditable', 'true');
          });

          return DecorationSet.create(state.doc, [leftDecoration, rightDecoration]);
        } /* else -- not in between inline Nodes with Content, do not add any extra decorations */

        return DecorationSet.empty;
      },

    },
  });

  return plugin;
};

// == Util ========================================================================
// NOTE: defined by contract given the way the state for the Plugin is computed
//       (SEE: InlineNodeWithContent#apply)
const getInlineNodeWithContentState = (state: EditorState<any>) => inlineNodeWithContentKey.getState(state) as InlineNodeWithContent/*by contract*/;

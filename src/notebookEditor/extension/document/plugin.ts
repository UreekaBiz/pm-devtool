import { Fragment, Node as ProseMirrorNode, Slice } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { createParagraphNode, isTextNode, AttributeType, NotebookSchemaType } from 'common';

import { NoPluginState } from 'notebookEditor/model/type';

// ********************************************************************************
// this Plugin implements behavior that is common to all the document

// == Plugin ======================================================================
const documentKey = new PluginKey<NoPluginState, NotebookSchemaType>('documentKey');
export const DocumentPlugin = () => {
  // differentiate between a regular paste and a text-only paste
  let textOnlyPaste = false/*default*/;

  const plugin = new Plugin<NoPluginState, NotebookSchemaType>({
    // -- Setup -------------------------------------------------------------------
    key: documentKey,

    // -- Props -------------------------------------------------------------------
    props: {
      handleDOMEvents: {
        // enable or disable Text only paste
        keydown: (view: EditorView, event: KeyboardEvent) => {
          if(event.shiftKey && (event.ctrlKey || event.metaKey) && (event.key === 'v' || event.key === 'V')) {
            textOnlyPaste = true/* enable Text only paste*/;
          } /* else -- do not modify state */
        },
        keyup: (view: EditorView, event: KeyboardEvent) => {
          if(!event.shiftKey) {
            textOnlyPaste = false/*by definition*/;
          } /* else -- do not modify state*/
        },
      },

      // paste Slice as Text if Text only paste is enabled
      handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => {
        if(!textOnlyPaste) {
          return false/*let PM handle the event regularly*/;
        } /* else -- Shift + CMD + V, paste Text only */

        const { state, dispatch } = view;
        const { schema, tr } = state;

          // NOTE: if the User tries to paste several Nodes into a Node that only admits
          //       Text, then those nodes will be turned into a Text node by default, and
          //       thus there will be no need to do anything special
          if(slice.content.firstChild && isTextNode(slice.content.firstChild) && slice.content.childCount === 1/*only the Text Node*/) {
            return false/*let PM handle event*/;
          } /* else -- handle event manually*/

        const insertedParagraphs: ProseMirrorNode[] = createParagraphsFromSlice(schema, slice);

        let { from, to } = tr.selection;
        if(tr.selection.$head.parent.content.childCount < 1) {
          from = from - 1/*replace the Block*/;
        } /* else -- parent has content, use regular from */

        tr.replaceWith(from, to, Fragment.fromArray(insertedParagraphs));
        dispatch(tr);
        return true/*event handled*/;
      },

      // REF: https://discuss.prosemirror.net/t/disable-ctrl-click/995/2
      // NOTE: prevents the default parent Node selection behavior
      //      from being triggered when either the CMD or the CTRL keys are pressed.
      //      This default behavior comes from PM (SEE: REF above)
      handleClick(view: EditorView, pos: number, event: MouseEvent) {
        if(event.ctrlKey || event.metaKey) return true/*(SEE: comment above)*/;

        return false/*allow regular event handling*/;
      },
    },
  });

  return plugin;
};

// == Util ========================================================================
/** Go through each Block in a Slice and return an array of Paragraphs from them */
const createParagraphsFromSlice = (schema: NotebookSchemaType, slice: Slice) => {
  const insertedParagraphs: ProseMirrorNode[] = [];
  slice.content.descendants((node, pos) => {
    if(node.isBlock) {
      const textContent = getTextContentFromBlockNode(node);
      insertedParagraphs.push(createParagraphNode(schema, undefined/*no attrs*/, schema.text(textContent)));
    } /* else -- ignore */
  });
  return insertedParagraphs;
};

/** Get the Text inside a Block Node as a string */
const getTextContentFromBlockNode = (blockNode: ProseMirrorNode) => {
  let textContent = ''/*default*/;
  blockNode.descendants(inlineChild => {
    if(inlineChild.attrs[AttributeType.Text]) {
      textContent += inlineChild.attrs[AttributeType.Text] ?? ''/*do not add anything if no text*/;
    } else {
      textContent += inlineChild.text;
    }
  });

  return textContent;
};

import { Node } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { DocumentNodeSpec, NotebookSchemaType } from 'common';

import { NoOptions, NoStorage } from 'notebookEditor/model/type';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-document/src/document.ts

// == Node ========================================================================
export const Document = Node.create<NoOptions, NoStorage>({
  ...DocumentNodeSpec,

  // -- Plugin --------------------------------------------------------------------
  // REF: https://discuss.prosemirror.net/t/disable-ctrl-click/995/2
  // NOTE: this Plugin prevents the default parent Node selection behavior
  //      from being triggered when either the CMD or the CTRL keys are pressed.
  //      This default behavior comes from PM (SEE: REF above)
  addProseMirrorPlugins() {
    return [
      new Plugin<NotebookSchemaType>({
        props: {
          handleClick(view: EditorView, pos: number, event: MouseEvent) {
            if(event.ctrlKey || event.metaKey) return true/*(SEE: comment above)*/;

            return false/*allow regular event handling*/;
          },
        },
      }),
    ];
  },

  // -- Keyboard Shortcut ---------------------------------------------------------
  // REF: https://prosemirror.net/docs/ref/#commands.pcBaseKeymap
  // NOTE: the default behavior for Mod-Enter (SEE: REF above) is to call
  //       exitCode() (which inserts a Paragraph below when the Selection is in a
  //       Node with the code prop in its Spec set to true. Since this behavior has
  //       been customized to Shift-Enter, reserving Cmd-Enter for execution of
  //       other Nodes at a Document level, return true
  //       (preventing the default behavior)
  addKeyboardShortcuts() { return { 'Mod-Enter': () => true/*do not let PM handle the shortcut*/ }; },
});

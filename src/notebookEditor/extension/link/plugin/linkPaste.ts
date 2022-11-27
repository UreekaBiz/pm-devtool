import { find } from 'linkifyjs';
import { Slice } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { urlSchema, setMarkCommand, AttributeType, MarkName, LinkTarget } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { NoPluginState } from 'notebookEditor/model/type';

// ********************************************************************************
// ensure Links that get pasted into the Editor receive the Link Mark

// == Plugin ======================================================================
const linkPasteKey = new PluginKey<NoPluginState>('linkPasteKey');
export const linkPaste = (editor: Editor): Plugin => {
  return new Plugin({
    key: linkPasteKey,

    // -- Props -------------------------------------------------------------------
    // NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-link/src/helpers/pasteHandler.ts
    props: {
      // ensure that when a Link is pasted over a Text that does not already
      // have a Link Mark, and the Selection is not empty, the selected portion
      // of Text receives the Link Mark with the pasted Link as its href attribute
      handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => {
        const { state } = view,
             { selection } = state,
             { empty } = selection;
        if(empty) return false/*nothing else to do*/;

        // merge the content of all Nodes from the Slice
        let textContent = '';
        slice.content.forEach(node => textContent += node.textContent);

        // find a valid Link using the linkifyjs library
        const link = find(textContent).find(item => item.isLink && item.value === textContent.trim(/*to take into account transformPastedText effects*/));
        if(!textContent || !link) return false/*nothing else to do*/;
        const { href } = link;

        if(editor.isNodeOrMarkActive(MarkName.LINK)) return false/*replace text*/;

        return setMarkCommand(MarkName.LINK, { [AttributeType.Href]: href, [AttributeType.Target]: LinkTarget.BLANK })(view.state, view.dispatch);
      },

      // ensure that pasted Links get a space added to them at the end, so that
      // typing after having pasted a Link does not include the Link Mark
      transformPastedText(text: string) {
        try {
          const isUrl = urlSchema.validateSync(text);
          if(isUrl) {
            text += ' ';
          } /* else -- not an url, do not add space */
          return text;
        } catch(error) {
          return text/*not an url, return text without modification*/;
        }
      },
    },
  });
};

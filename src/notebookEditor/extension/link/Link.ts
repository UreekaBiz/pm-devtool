import { find } from 'linkifyjs';

import { getMarkOutputSpec, AttributeType, LinkMarkSpec, DEFAULT_LINK_TAG, MarkName, getLinkMarkType } from 'common';

import { ExtensionPriority } from 'notebookEditor/model/type';
import { DialogStorage } from 'notebookEditor/model/DialogStorage';
import { MarkExtension } from 'notebookEditor/extension';

import { LinkAttrs } from './attribute';
import { linkClick, linkCreate, linkPaste } from './plugin';
import { createMarkPasteRule } from 'notebookEditor/plugin/pasteRule';

// ********************************************************************************
// == Mark ========================================================================
export const Link = new MarkExtension({
  name: MarkName.LINK,
  priority: ExtensionPriority.LINK,

  // -- Spec ----------------------------------------------------------------------
  markSpec: {
    ...LinkMarkSpec,

    attrs: LinkAttrs,

    parseDOM: [{ tag: DEFAULT_LINK_TAG }],
    toDOM: (mark) => getMarkOutputSpec(mark, LinkAttrs),
  },
  // -- Storage -------------------------------------------------------------------
  storage: new DialogStorage(),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [
    createMarkPasteRule(
      (text) => find(text).filter(link => link.isLink).map(link => ({ text: link.value, index: link.start, data: link })),
      getLinkMarkType(editor.view.state.schema),
      (match) => ({ [AttributeType.Href]: match.data?.href })),
  ],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [linkClick(), linkCreate(undefined/*no validation at the moment*/), linkPaste(editor)],
});

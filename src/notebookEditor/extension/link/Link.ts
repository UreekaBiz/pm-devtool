import { find } from 'linkifyjs';

import { getLinkMarkType, getMarkOutputSpec, AttributeType, LinkMarkSpec, MarkName, DEFAULT_LINK_TAG } from 'common';

import { ExtensionPriority } from 'notebookEditor/model/type';
import { DialogStorage } from 'notebookEditor/model/DialogStorage';
import { createMarkPasteRule } from 'notebookEditor/plugin/pasteRule/pasteRuleBuilders';

import { MarkExtension } from '../type/MarkExtension/MarkExtension';
import { LinkAttrs } from './attribute';
import { linkClick, linkCreate, linkPaste } from './plugin';

// ********************************************************************************
// == Mark ========================================================================
export const Link = new MarkExtension({
  name: MarkName.LINK,
  priority: ExtensionPriority.LINK,

  // -- Attribute -----------------------------------------------------------------
  defineMarkAttributes: (extensionStorage) => LinkAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialMarkSpec: { ...LinkMarkSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: [{ tag: DEFAULT_LINK_TAG }],
    toDOM: (mark) => getMarkOutputSpec(mark, LinkAttrs),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new DialogStorage(),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [
    createMarkPasteRule(
      (text) => find(text).filter(link => link.isLink).map(link => ({ text: link.value, index: link.start, data: link })),
      getLinkMarkType(editor.view.state.schema),
      (match) => ({ [AttributeType.Href]: (match[0/*pasted link*/] ?? ''/*default*/).trim() })),
  ],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [linkClick(), linkCreate(undefined/*no validation at the moment*/), linkPaste(editor)],
});

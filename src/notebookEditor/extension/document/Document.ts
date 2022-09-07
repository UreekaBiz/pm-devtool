import { textInputRule, Node } from '@tiptap/core';

import { DocumentNodeSpec } from 'common';

import { NoOptions, NoStorage } from 'notebookEditor/model/type';

import { DocumentPlugin } from './plugin';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-document/src/document.ts

// == Constant ====================================================================
// a map of strings that, when typed, get replaced by a specific character
const documentInputRules: { find: RegExp; replace: string; }[] = [
  { find: /<-$/, replace: '←' },
  { find: /->$/, replace: '→' },
];

// == Node ========================================================================
export const Document = Node.create<NoOptions, NoStorage>({
  ...DocumentNodeSpec,

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins() { return [DocumentPlugin()]; },

  // -- Keyboard Shortcut ---------------------------------------------------------
  // REF: https://prosemirror.net/docs/ref/#commands.pcBaseKeymap
  // NOTE: the default behavior for Mod-Enter (SEE: REF above) is to call
  //       exitCode() (which inserts a Paragraph below when the Selection is in a
  //       Node with the code prop in its Spec set to true. Since this behavior has
  //       been customized to Shift-Enter, reserving Cmd-Enter for execution of
  //       other Nodes at a Document level, return true
  //       (preventing the default behavior)
  addKeyboardShortcuts() { return { 'Mod-Enter': () => true/*do not let PM handle the shortcut*/ }; },

  // -- Input ---------------------------------------------------------------------
  addInputRules() { return documentInputRules.map(({ find, replace }) => textInputRule({ find, replace })); },
});

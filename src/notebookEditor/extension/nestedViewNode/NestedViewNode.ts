import { keymap } from 'prosemirror-keymap';

import { ExtensionName } from 'notebookEditor/model/type';

import { DEFAULT_EXTENSION_PRIORITY, Extension } from '../type';
import { nestedViewNodeBackspaceCommand } from './command';
import './nestedViewNode.css';
import { nestedViewNodePlugin } from './plugin';


// ********************************************************************************
// NOTE: nestedViewNodes are meant to be an abstraction for Inline or Block Nodes
//       whose functionality involves a nested EditorView.
// NOTE: All common attributes shared across NestedViewNodes are defined in its
//       corresponding common file
//       (SEE: src/common/notebookEditor/extension/nestedViewNode.ts)
// == Extension ===================================================================
export const NestedViewNode = new Extension({
  name: ExtensionName.NESTED_VIEW_NODE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    nestedViewNodePlugin(),
    keymap({ 'Backspace': () => nestedViewNodeBackspaceCommand(editor.view.state, editor.view.dispatch) }),
  ],
});

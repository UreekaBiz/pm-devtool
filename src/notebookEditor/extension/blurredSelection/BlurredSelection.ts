import { ExtensionName } from 'notebookEditor/model/type';

import { Extension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { blurredSelectionPlugin } from './plugin';

// ********************************************************************************
// applies a BackgroundColor to the current Selection when it is a TextSelection and
// the EditorView is not focused
// (SEE: index.css)
// REF: https://discuss.prosemirror.net/t/add-css-class-to-current-node-or-selected-nodes/1287

// == Extension ===================================================================
export const BlurredSelection = new Extension({
  name: ExtensionName.BLURRED_SELECTION/*Expected and guaranteed to be unique*/,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [blurredSelectionPlugin(editor)],
});

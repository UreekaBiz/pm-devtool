import { ExtensionName } from 'notebookEditor/model/type';

import { Extension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { inBetweenInlineAtomsPlugin, blurredSelectionPlugin } from './plugin';

// ********************************************************************************
// (SEE: index.css)

// == Extension ===================================================================
export const SelectionHandling = new Extension({
  name: ExtensionName.SELECTION_HANDLING/*Expected and guaranteed to be unique*/,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    // applies a BackgroundColor to the current Selection when it is a TextSelection and
    // the EditorView is not focused
    blurredSelectionPlugin(editor),

    // prevent the cursor from disappearing when it is set in between two Nodes that
    // are inline but are not Text
    inBetweenInlineAtomsPlugin(),
  ],
});

import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { chainCommands, liftEmptyBlockNodeCommand, splitBlockCommand, deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand, joinForwardCommand, selectNodeForwardCommand } from 'common';

import { Editor } from '../editor';
import { documentPlugin } from './node';
import { paragraphPlugin } from './node/paragraph/plugin';

// ********************************************************************************
/**
 * defines the Plugins that get added to the Editor. Those that
 * appear first in the array get their functionality executed first
 */
export const getEditorPlugins = (editor: Editor): ProseMirrorPlugin[] => {
  return [
    // -- History -----------------------------------------------------------------
    history({ depth: 100/*PM's default*/, newGroupDelay: 500/*PM's default, in ms*/ }),
    keymap({ 'Mod-z': undo, 'Mod-Shift-z': redo }),

    // -- Paragraph ---------------------------------------------------------------
    paragraphPlugin(editor),

    // -- Document ----------------------------------------------------------------
    documentPlugin(),

    // -- Basic Keymap ------------------------------------------------------------
    keymap({
      'Enter': chainCommands(liftEmptyBlockNodeCommand, splitBlockCommand),
      'Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
      'Mod-Backspace': chainCommands(deleteSelectionCommand, joinBackwardCommand, selectNodeBackwardCommand),
      'Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
      'Mod-Delete': chainCommands(deleteSelectionCommand, joinForwardCommand, selectNodeForwardCommand),
    }),
  ];
};

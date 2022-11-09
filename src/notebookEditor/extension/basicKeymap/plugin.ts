import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { selectTextBlockStartOrEndCommand } from 'common';

// == Constant ====================================================================
const HOME = 'Home';
const END = 'End';

// == Plugin ======================================================================
/**
 * add keyboard functionality to override key behavior that is not available
 * through the ProseMirror keymap Plugin
 */
export const basicKeymapPlugin = () => new Plugin({
  // -- Props ---------------------------------------------------------------------
  props: {
    // .. Handler .................................................................
    /**
     * when the User presses the Home or End keys, move the cursor to the
     * beginning or end of the parent TextBlock respectively
     */
    handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
      if(event.code === HOME) {
        selectTextBlockStartOrEndCommand('start')(view.state, view.dispatch);
        return true/*event handled*/;
      } else if(event.code === END) {
        selectTextBlockStartOrEndCommand('end')(view.state, view.dispatch);
        return true/*event handled*/;
      } else {
        return false/*let the event be handled elsewhere*/;
      }
    },
  },
});

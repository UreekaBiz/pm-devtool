import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { selectTextBlockStartOrEndCommand, NodeName } from 'common';

import { NoPluginState } from 'notebookEditor/model';

// == Constant ====================================================================
const HOME = 'Home';
const END = 'End';

// == Plugin ======================================================================
/**
 * add keyboard functionality to override key behavior that is not available
 * through the ProseMirror keymap Plugin
 */
export const basicKeymapPlugin = () => new Plugin({
  // -- Definition --------------------------------------------------------------
  key: new PluginKey<NoPluginState>('basicKeyMapPluginKey'),

  // -- Props ---------------------------------------------------------------------
  props: {
    // .. Handler .................................................................
    /**
     * when the User presses the Home or End keys, move the cursor to the
     * beginning or end of the parent TextBlock respectively
     */
    handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
      const currentNodeName = view.state.selection.$anchor.parent.type.name as NodeName/*by definition*/;

      if(event.code === HOME) {
        selectTextBlockStartOrEndCommand('start', currentNodeName)(view.state, view.dispatch);
        return true/*event handled*/;
      } else if(event.code === END) {
        selectTextBlockStartOrEndCommand('end', currentNodeName)(view.state, view.dispatch);
        return true/*event handled*/;
      } else {
        return false/*let the event be handled elsewhere*/;
      }
    },
  },
});

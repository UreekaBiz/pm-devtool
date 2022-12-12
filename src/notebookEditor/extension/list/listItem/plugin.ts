import { Slice } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';

import { isListNode } from 'common';

import { NoPluginState } from 'notebookEditor/model/type';

// ********************************************************************************
// == Plugin ======================================================================
export const listItemPlugin = () => new Plugin<NoPluginState>({
  // -- Definition --------------------------------------------------------------
  key: new PluginKey('listItemPluginKey'),

  // -- Props ---------------------------------------------------------------------
  props: {
    /**
     * REF: https://discuss.prosemirror.net/t/what-is-openstart-and-openend-use-for/3999
     *
     * whenever content inside a List is being copied, and hence the firstChild of
     * the Slice is a List, ensure that the openStart and openEnd of the Slice are
     * 0, so that the contents of the List do not get chopped off when
     * pasting them, which would result in loose ListItems (SEE: REF above)
     */
    transformCopied: (slice, view) => {
      const { firstChild } = slice.content;
      if(!firstChild || !isListNode(firstChild)) return slice/*do not change*/;

      return new Slice(slice.content, 0/*use full Slice*/, 0/*use full Slice*/);
    },
  },
});


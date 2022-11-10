import { DATA_NODE_TYPE, getNodeOutputSpec, NodeName, TableNodeSpec } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension } from 'notebookEditor/extension/type';
import { ExtensionPriority, NodeViewStorage } from 'notebookEditor/model';
// import { keymap } from 'prosemirror-keymap';
// import { tableColumnResizingPlugin } from '../../plugin/tableColumnResizing';

import { TableView } from '../../tableview';
import { getTableAttrs } from './attribute';

// ********************************************************************************
// == Node ========================================================================
export const Table = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.TABLE,
  priority: ExtensionPriority.TABLE,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => getTableAttrs(extensionStorage),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...TableNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `table[${DATA_NODE_TYPE}="${NodeName.TABLE}"]` }, { tag: 'table' }], getTableAttrs(extensionStorage)),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, getTableAttrs(extensionStorage))),
  }),

  // -- Storage -------------------------------------------------------------------
  addStorage: () => new NodeViewStorage<TableView>(),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    // keymap({
    //   'Tab': () => {
    //     if(this.editor.commands.goToNextCell()) {
    //       return true;
    //     } /* else -- cannot go to the next cell */

    //     if(!this.editor.can().addRowAfter()) {
    //       return false;
    //     } /* else -- can add a row after, do so and then go to next cell */

    //     return this.editor.chain().addRowAfter().goToNextCell().run();
    //   },
    //   'Shift-Tab': () => this.editor.commands.goToPreviousCell(),
    //   'Backspace': deleteTableWhenAllCellsSelected,
    //   'Mod-Backspace': deleteTableWhenAllCellsSelected,
    //   'Delete': deleteTableWhenAllCellsSelected,
    //   'Mod-Delete': deleteTableWhenAllCellsSelected,

    // }),
    // tableColumnResizingPlugin(),
    // tableEditing({ allowTableNodeSelection: this.options.allowTableNodeSelection }),
  ],
});

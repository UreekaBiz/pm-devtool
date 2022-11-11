import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, isTableNode, NodeName, TableNodeSpec, DATA_NODE_TYPE, TABLE_HANDLE_DETECTION_AREA, MIN_CELL_WIDTH } from 'common';

import { createExtensionParseRules, defineNodeViewBehavior, getExtensionAttributesObject, NodeExtension } from 'notebookEditor/extension/type';
import { ExtensionPriority, NodeViewStorage } from 'notebookEditor/model';

import { tableColumnResizingPlugin } from '../../plugin/tableColumnResizing';
import { tableEditingPlugin } from '../../plugin/tableEditing';
import { addRowAfter, goToCell } from '../../command';
import { getTableAttrs } from './attribute';
import { deleteTableWhenAllCellsSelected } from './command';
import { TableController } from './nodeView';
import './table.css';

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
  addStorage: () => new NodeViewStorage<TableController>(),

  // -- View ----------------------------------------------------------------------
  defineNodeView: (editor, node, getPos) => defineNodeViewBehavior<TableController>(editor, node, NodeName.TABLE, getPos, isTableNode, TableController),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    tableEditingPlugin(false/*do not allow Table Node Selection*/),
    tableColumnResizingPlugin(TABLE_HANDLE_DETECTION_AREA, MIN_CELL_WIDTH, false/*do not make the last Column resizable*/),
    keymap({
      'Tab': () => {
        if(goToCell('next')(editor.view.state, editor.view.dispatch)) {
          return true;
        } /* else -- cannot go to the next Cell */

        if(!addRowAfter(editor.view.state, undefined/*just check*/)) {
          return false;
        } /* else -- can add a row after, do so and then go to next Cell */

        return true;
        // TODO: handle with DocumentUpdates
        // return this.editor.chain().addRowAfter().goToCell().run();
      },
      'Shift-Tab': () => goToCell('previous')(editor.view.state, editor.view.dispatch),
      'Backspace': deleteTableWhenAllCellsSelected,
      'Mod-Backspace': deleteTableWhenAllCellsSelected,
      'Delete': deleteTableWhenAllCellsSelected,
      'Mod-Delete': deleteTableWhenAllCellsSelected,
    }),
  ],
});

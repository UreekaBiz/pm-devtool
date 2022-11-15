import { keymap } from 'prosemirror-keymap';

import { deleteTableWhenAllCellsSelected, getNodeOutputSpec, goToCellCommand, isTableNode, AddRowAfterDocumentUpdate, GoToCellDocumentUpdate, NodeName, TableNodeSpec, DATA_NODE_TYPE, TABLE_HANDLE_DETECTION_AREA, MIN_CELL_WIDTH } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command';
import { createExtensionParseRules, defineNodeViewBehavior, getExtensionAttributesObject, NodeExtension } from 'notebookEditor/extension/type';
import { ExtensionPriority, NodeViewStorage } from 'notebookEditor/model';

import { tableColumnResizingPlugin } from '../../plugin/tableColumnResizing';
import { tableEditingPlugin } from '../../plugin/tableEditing';
import { getTableAttrs } from './attribute';
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
    // NOTE: the column resize plugin must be added before the Table editing Plugin
    //        since it will ensure no incorrect CellSelections are drawn into
    //        the Editor while the resizing columns
    tableColumnResizingPlugin(TABLE_HANDLE_DETECTION_AREA, MIN_CELL_WIDTH, true/*make the last Column resizable*/),

    tableEditingPlugin(false/*do not allow Table Node Selection*/),

    keymap({
      'Tab': () => {
        if(goToCellCommand('next')(editor.view.state, editor.view.dispatch)) {
          return true/*handled*/;
        } /* else -- cannot go to the next Cell, try adding and focusing */

        return applyDocumentUpdates(editor, [
          new AddRowAfterDocumentUpdate(),
          new GoToCellDocumentUpdate('next'),
        ]);
      },

      'Shift-Tab': () => goToCellCommand('previous')(editor.view.state, editor.view.dispatch),
      'Backspace': deleteTableWhenAllCellsSelected,
      'Mod-Backspace': deleteTableWhenAllCellsSelected,
      'Delete': deleteTableWhenAllCellsSelected,
      'Mod-Delete': deleteTableWhenAllCellsSelected,
    }),
  ],
});

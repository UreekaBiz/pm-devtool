import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';

import { drawCellSelection, fixTables, normalizeSelection } from 'common';

import { handleTripleClick, handleTableArrowKeydown, handlePaste, handleCellSelectionMousedown } from '../input';

// == Constant ====================================================================
// This file defines a plugin that handles the drawing of cell
// selections and the basic user interactions for creating and working
// with such selections. It also makes sure that, after each
// transaction, the shapes of tables are normalized to be rectangular
// and not contain overlapping cells.


// == Class =======================================================================
class TableEditingState {
  // -- Attribute -----------------------------------------------------------------
  currentValue: number | null;

  // -- Lifecycle -----------------------------------------------------------------
  constructor(currentValue: number | null) {
    this.currentValue = currentValue;
  }

  /*
   * the state remembers when a mouse-drag CellSelection is happening
   * so that it can continue even as Transactions (which might move its
   * anchor cell) come in
   */
  public apply = (tr: Transaction, thisPluginState: TableEditingState, oldEditorState: EditorState, newEditorState: EditorState) => {
    const meta = tr.getMeta(tableEditingPluginKey);
    if(meta !== null) {
      if(meta === -1) { this.currentValue = null; return this; }
      else { this.currentValue = meta; return this; }
    } /* else -- meta is null */

    if(thisPluginState.currentValue === null) {
      return this;
    } /* else -- currentValue is not null */

    if(!tr.docChanged) {
      return this;
    } /* else -- the doc changed */

    const { deleted, pos } = tr.mapping.mapResult(thisPluginState.currentValue);
    if(deleted) { this.currentValue = null; return this; }
    else { this.currentValue = pos; return this; }
  };
}

// == Key ========================================================================
export const tableEditingPluginKey = new PluginKey<TableEditingState>('tableEditingPluginKey');

// == Plugin ======================================================================
/**
 * Plugin that enables CellSelection, handles cell-based Copy/Paste, and makes
 * sure Tables stay well formed (each row has the same width, and
 * Cells do not overlap)
 *
 * The Extension adding this Plugin should have a high priority, since it handles
 * Mouse and Arrow key events
 */
export const tableEditingPlugin = (allowTableNodeSelection = false/*default*/) =>
  new Plugin<TableEditingState>({
    // -- State -------------------------------------------------------------------
    key: tableEditingPluginKey,
    state: {
      init() { return new TableEditingState(null/*default no currentValue*/); },
      apply: (transaction, thisPluginState, oldState, newState) => thisPluginState.apply(transaction, thisPluginState, oldState, newState),
    },

    // -- Transaction -------------------------------------------------------------
    appendTransaction: (_, oldState, newState) => normalizeSelection(newState, allowTableNodeSelection, fixTables(oldState, newState)),

    // -- Prop --------------------------------------------------------------------
    props: {
      decorations: drawCellSelection,
      handleDOMEvents: { mousedown: handleCellSelectionMousedown },

      createSelectionBetween: (view) => {
        const tableEditingStateValue = tableEditingPluginKey.getState(view.state)?.currentValue;
        if(tableEditingStateValue) {
          return view.state.selection;
        } /* else -- state is null */

        return null/*no Selection*/;
      },

      handleTripleClick,
      handleKeyDown: handleTableArrowKeydown,
      handlePaste,
    },
  });

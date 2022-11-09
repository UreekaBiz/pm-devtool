import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';

import { drawCellSelection, normalizeSelection } from 'common';

import { handleTripleClick, handleKeyDown, handlePaste, handleMouseDown } from '../input';
import { fixTables } from '../fixtables';

// == Constant ====================================================================
// This file defines a plugin that handles the drawing of cell
// selections and the basic user interactions for creating and working
// with such selections. It also makes sure that, after each
// transaction, the shapes of tables are normalized to be rectangular
// and not contain overlapping cells.

export const tableEditingPluginKey = new PluginKey('tableEditingPluginKey');

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
   * so that it can continue even as transactions (which might move its
   * anchor cell) come in
   */
  public apply = (tr: Transaction, thisPluginState: TableEditingState, oldEditorState: EditorState, newEditorState: EditorState) => {
    const meta = tr.getMeta(tableEditingPluginKey);
    if(meta !== null) {
      if(meta === -1) { return null; }
      else { return meta; }
    } /* else -- meta is null */

    if(thisPluginState.currentValue === null) {
      return this.currentValue;
    } /* else -- currentValue is not null */

    if(!tr.docChanged) {
      return this.currentValue;
    } /* else -- the doc changed */

    const { deleted, pos } = tr.mapping.mapResult(thisPluginState.currentValue);
    if(deleted) { return null; }
    else { return pos; }
  };
}

// == Plugin ======================================================================
/**
 * Plugin that enables CellSelection, handles cell-based Copy/Paste, and makes
 * sure Tables stay well formed (each row has the same width, and
 * Cells do not overlap)
 *
 * The Extension adding this Plugin should have a high priority, since it handles
 * Mouse and Arrow key events
 */
export const tableEditingPlugin = ({ allowTableNodeSelection = false/*default*/ } = {}) =>
  new Plugin<TableEditingState>({
    // -- State -------------------------------------------------------------------
    key: tableEditingPluginKey,
    state: {
      init() { return new TableEditingState(null/*default no currentValue*/); },
      apply: (transaction, thisPluginState, oldState, newState) => thisPluginState.apply(transaction, thisPluginState, oldState, newState),
    },

    // -- Transaction -------------------------------------------------------------
    appendTransaction: (_, oldState, state) => normalizeSelection(state, fixTables(state, oldState), allowTableNodeSelection),

    // -- Prop --------------------------------------------------------------------
    props: {
      decorations: drawCellSelection,
      handleDOMEvents: { mousedown: handleMouseDown },

      createSelectionBetween(view) {
        if(tableEditingPluginKey.getState(view.state) != null) {
          return view.state.selection;
        } /* else -- state is null */

        return null;
      },

      handleTripleClick,
      handleKeyDown,
      handlePaste,
    },
  });

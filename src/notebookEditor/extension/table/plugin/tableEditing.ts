import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';

import { drawCellSelection, fixTables, normalizeSelection } from 'common';

import { handleTripleClick, handleTableArrowKeydown, handlePaste, handleCellSelectionMousedown } from '../tableInput';

// == Constant ====================================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/index.js

// handle the drawing of CellSelection, as well as the user interactions for
// creating and working with them. Normalize the shape of Tables after each
// Transaction to be rectangular and not contain overlapping Cells

// == Class =======================================================================
class TableEditingState {
  // -- Lifecycle -----------------------------------------------------------------
  constructor(public currentCellSelectionAnchor: number | null) {/*nothing additional*/}

  /*
   * remember when a mouse-drag CellSelection is happening. Continue even
   * if Transactions that move that might move its anchor Cell come in
   */
  public apply = (tr: Transaction, thisPluginState: TableEditingState, oldEditorState: EditorState, newEditorState: EditorState) => {
    const tableEditingMeta = tr.getMeta(tableEditingPluginKey);

    if(tableEditingMeta !== null) {
      if(tableEditingMeta === -1/*stop keeping track of CellSelection*/) { this.currentCellSelectionAnchor = null/*stop*/; return this; }
      else { this.currentCellSelectionAnchor = tableEditingMeta; return this/*updated*/; }
    } /* else -- meta is null */

    if(thisPluginState.currentCellSelectionAnchor === null) {
      return this/*continue without doing anything special*/;
    } /* else -- currentValue is not null */

    if(!tr.docChanged) {
      return this/*continue without doing anything special*/;
    } /* else -- the doc changed */

    const { deleted, pos } = tr.mapping.mapResult(thisPluginState.currentCellSelectionAnchor);
    if(deleted) { this.currentCellSelectionAnchor = null/*deleted the CellSelection*/; return this/*updated*/; }
    else { this.currentCellSelectionAnchor = pos/*mapped the result*/; return this/*updated*/; }
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
        const pluginState = tableEditingPluginKey.getState(view.state);

        if(pluginState && pluginState.currentCellSelectionAnchor) {
          return view.state.selection;
        } /* else -- state is null */

        return null/*no Selection*/;
      },

      handleTripleClick,
      handleKeyDown: handleTableArrowKeydown,
      handlePaste,
    },
  });

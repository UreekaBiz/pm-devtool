import { ResolvedPos } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { cellAround, isCellSelection, inSameTable, CellSelection } from 'common';

import { isValidHTMLElement } from '../../util';
import { tableEditingPluginKey } from '../plugin/tableEditing';
import { getDOMNodeInCell, isCellUnderMouse } from './util';

// ********************************************************************************
// == Mousedown ===================================================================
export const handleCellSelectionMousedown = (view: EditorView, startEvent: MouseEvent) => {
  // --------------------------------------------------------------------------------
  // create a CellSelection between the given anchor and the position under the mouse
  const setCellSelection = ($anchor: ResolvedPos, event: Event) => {
    let $head = isCellUnderMouse(view, event);

    const currentCellSelectionAnchor = tableEditingPluginKey.getState(view.state)?.currentCellSelectionAnchor;
    const isCellSelectionStarting = currentCellSelectionAnchor === null || currentCellSelectionAnchor === undefined;

    if(!$head || !inSameTable($anchor, $head)) {
      if(isCellSelectionStarting) { $head = $anchor/*default to be the same*/; }
      else { return/*do not handle*/; }
    } /* else -- valid $head or $anchor and $head are in the same Table */

    const cellSelection = new CellSelection($anchor, $head);
    if(isCellSelectionStarting || !view.state.selection.eq(cellSelection)) {
      const { tr } = view.state;
      tr.setSelection(cellSelection);

      if(isCellSelectionStarting) {
        tr.setMeta(tableEditingPluginKey, $anchor.pos);
      } /* else -- not starting the MouseEvent */

      view.dispatch(tr);
    }
  };

  // ------------------------------------------------------------------------------
  const stopMouseMotionTracking = () => {
    view.root.removeEventListener('mouseup', stopMouseMotionTracking);
    view.root.removeEventListener('dragstart', stopMouseMotionTracking);
    view.root.removeEventListener('mousemove', handleMouseMove);

    const tableEditingStateValue = tableEditingPluginKey.getState(view.state)?.currentCellSelectionAnchor;
    if(tableEditingStateValue) {
      view.dispatch(view.state.tr.setMeta(tableEditingPluginKey, -1/*stop*/));
    } /* else -- no tableEditing state */
  };

  // ------------------------------------------------------------------------------
  const handleMouseMove = (event: Event) => {
    if(!event.target || !isValidHTMLElement(event.target)) return/*nothing to do*/;

    const pluginState = tableEditingPluginKey.getState(view.state);
    const currentCellSelectionAnchor = pluginState?.currentCellSelectionAnchor;

    let $anchor;
    if(currentCellSelectionAnchor) {
      // continue an existing CellSelection
      $anchor = view.state.doc.resolve(currentCellSelectionAnchor);

    } else if(getDOMNodeInCell(view, event.target) !== startDOMCell) {
      $anchor = isCellUnderMouse(view, startEvent);
      if(!$anchor) {
        return stopMouseMotionTracking();
      } /* else -- do not stop yet */
    } /* else -- target is not the startingDOMCell */

    if($anchor) {
      setCellSelection($anchor, event);
    } /* else -- not a valid $anchor, do not set a CellSelection */
  };

  // -- Handler -------------------------------------------------------------------
  if(!startEvent.target || !isValidHTMLElement(startEvent.target)) return/*do not handle*/;
  if(startEvent.ctrlKey || startEvent.metaKey) return/*do not handle*/;

  const startDOMCell = getDOMNodeInCell(view, startEvent.target);
  let $anchor;
  if(startEvent.shiftKey && isCellSelection(view.state.selection)) {
    // adding to an existing cell selection
    setCellSelection(view.state.selection.$anchorCell, startEvent);
    startEvent.preventDefault();

  } else if(startEvent.shiftKey && startDOMCell && ($anchor = cellAround(view.state.selection.$anchor)) !== null && isCellUnderMouse(view, startEvent)?.pos !== $anchor.pos) {
    // adding to a Selection that starts in another Cell (causing a CellSelection
    // to be created)
    setCellSelection($anchor, startEvent);
    startEvent.preventDefault();

  } else if(!startDOMCell) {
    return/*not in a Cell, let PM handle the event*/;
  }

  // NOTE: this order is not arbitrary. It is important to add the listeners here
  view.root.addEventListener('mouseup', stopMouseMotionTracking);
  view.root.addEventListener('dragstart', stopMouseMotionTracking);
  view.root.addEventListener('mousemove', handleMouseMove);
};

// == Click =======================================================================
export const handleCellTripleClick = (view: EditorView, pos: number) => {
  const { doc } = view.state;

  const $cellPos = cellAround(doc.resolve(pos));
  if(!$cellPos) return false/*did not click on a Cell*/;

  view.dispatch(view.state.tr.setSelection(new CellSelection($cellPos)));
  return true/*handled*/;
};


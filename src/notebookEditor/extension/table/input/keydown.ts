import { keydownHandler } from 'prosemirror-keymap';
import { Command, EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { isCellSelection, getMovedCellResolvedPos, AbstractDocumentUpdate, CellSelection } from 'common';
import { deleteCellSelectionCommand, setNewCellSelectionFromInput } from './selection';
import { isCursorAtEndOfCell } from './util';

// ********************************************************************************
// == Arrow =======================================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js#L44
/** handle arrow key behavior when inside a Table Node */
const tableArrowHandlerCommand = (axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/down*/): Command => (state, dispatch, view) =>
  AbstractDocumentUpdate.execute(new TableArrowHandlerDocumentUpdate(axis, direction), state, dispatch, view);
class TableArrowHandlerDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly axis: 'horizontal' | 'vertical', private readonly direction: -1/*left/up*/ | 1/*right/down*/) {/*nothing additional*/}

  /**
   * modify the given Transaction such that arrow key behavior is handled when
   * inside a Table Node
   */
  public update(editorState: EditorState, tr: Transaction, view?: EditorView) {
    const { selection } = editorState;
    if(isCellSelection(selection)) {
      return setNewCellSelectionFromInput(editorState, Selection.near(selection.$headCell), tr);
    } /* else -- not a CellSelection */

    if(this.axis !== 'horizontal' && !selection.empty) return false/*do not allow*/;

    const isAtEndOfCell = view && isCursorAtEndOfCell(view, this.axis, this.direction);
    if(!isAtEndOfCell || isAtEndOfCell === null) return false/*not at the end of the Cell*/;

    if(this.axis == 'horizontal') {
      return setNewCellSelectionFromInput(editorState, Selection.near(editorState.doc.resolve(selection.head + this.direction), this.direction), tr);
    } else {
      const $cellPos = editorState.doc.resolve(isAtEndOfCell),
            $nextCellPos = getMovedCellResolvedPos($cellPos, this.axis, this.direction);

      let newSelection;
      if($nextCellPos) { newSelection = Selection.near($nextCellPos, 1); }
      else if(this.direction < 0/*left*/) { newSelection = Selection.near(editorState.doc.resolve($cellPos.before(-1/*grandParent depth*/)), -1/*bias to the left*/); }
      else { newSelection = Selection.near(editorState.doc.resolve($cellPos.after(-1/*grandParent depth*/)), 1/*bias to the right*/); }

      return setNewCellSelectionFromInput(editorState, newSelection, tr)/*updated*/;
    }
  }
}

// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js#L76
/** handle shift arrow key behavior when inside of a  Table Node */
const tableShiftArrowHandlerCommand = (axis: 'horizontal' | 'vertical', direction: -1/*left/up*/ | 1/*right/down*/): Command => (state, dispatch, view) =>
  AbstractDocumentUpdate.execute(new TableShiftArrowHandlerDocumentUpdate(axis, direction), state, dispatch, view);
class TableShiftArrowHandlerDocumentUpdate implements AbstractDocumentUpdate {
  constructor(private readonly axis: 'horizontal' | 'vertical', private readonly direction: -1/*left/up*/ | 1/*right/down*/) {/*nothing additional*/}

  /**
   * modify the given Transaction such that shift arrow key behavior is handled when
   * inside of a Table Node
  */
  public update(editorState: EditorState, tr: Transaction, view?: EditorView) {
    let { selection } = editorState;
    if(!isCellSelection(selection)) {
      const isAtEnd = view && isCursorAtEndOfCell(view, this.axis, this.direction);
      if(!isAtEnd || isAtEnd === null) return false/*nothing to do*/;

      selection = new CellSelection(editorState.doc.resolve(isAtEnd));
    } /* else -- Selection is CellSelection */

    const $nextCellHead = getMovedCellResolvedPos((selection as CellSelection/*guaranteed by above check*/).$headCell, this.axis, this.direction);
    if(!$nextCellHead) return false/*nothing to do*/;

    return setNewCellSelectionFromInput(editorState, new CellSelection((selection as CellSelection/*guaranteed by above check*/).$anchorCell, $nextCellHead), tr)/*updated*/;
  }
}

// == Keydown Handler =============================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-tables/blob/master/src/input.js#L44
export const handleTableArrowKeydown = keydownHandler({
  ArrowLeft: tableArrowHandlerCommand('horizontal', -1/*left*/),
  ArrowRight: tableArrowHandlerCommand('horizontal', 1/*right/down*/),
  ArrowUp: tableArrowHandlerCommand('vertical', -1/*left*/),
  ArrowDown: tableArrowHandlerCommand('vertical', 1/*right/down*/),

  'Shift-ArrowLeft': tableShiftArrowHandlerCommand('horizontal', -1/*left*/),
  'Shift-ArrowRight': tableShiftArrowHandlerCommand('horizontal', 1/*right/down*/),
  'Shift-ArrowUp': tableShiftArrowHandlerCommand('vertical', -1/*left*/),
  'Shift-ArrowDown': tableShiftArrowHandlerCommand('vertical', 1/*right/down*/),

  Backspace: deleteCellSelectionCommand,
  'Mod-Backspace': deleteCellSelectionCommand,
  Delete: deleteCellSelectionCommand,
  'Mod-Delete': deleteCellSelectionCommand,
});

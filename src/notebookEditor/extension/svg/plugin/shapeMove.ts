import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { NotebookSchemaType, NodeName } from 'common';
import { isNodeSelection } from 'notebookEditor/extension/util/node';

import { preventDefaults } from '../util';

// ********************************************************************************
// == Type ========================================================================
type ShapeMoveMeta = { shapeMoveEnabled: boolean; };
enum KeyDown {
  Up = 'ArrowUp',
  Right = 'ArrowRight',
  Down = 'ArrowDown',
  Left = 'ArrowLeft',
  Z = 'Z', z = 'z'/*undo-redo*/,
  C = 'C', c = 'c'/*copy*/,
  V = 'V', v = 'v'/*paste*/,
  X = 'X', x = 'x'/*cut*/,
}
enum Delta { Small = 1/*svgViewBoxUnits*/, Big = 5/*svgViewBoxUnits*/ }

// == Class =======================================================================
class ShapeMove {
  constructor(public shapeMoveEnabled: boolean ) { this.shapeMoveEnabled = shapeMoveEnabled; }

  apply(tr: Transaction, thisPluginState: ShapeMove, oldEditorState: EditorState, newEditorState: EditorState) { /*produce a new plugin state*/
    const shapeMoveMeta = getShapeMoveMeta(tr);
    if(!shapeMoveMeta) return this/*no changes*/;
    /* else -- update state */

    this.shapeMoveEnabled = shapeMoveMeta.shapeMoveEnabled;
    return this;
  }
}

// == Function ====================================================================
const shapeMoveKey = new PluginKey<ShapeMove, NotebookSchemaType>('shapeMove');
export const shapeMove = () => {
  let plugin = new Plugin<ShapeMove, NotebookSchemaType>({
    // -- Setup -------------------------------------------------------------------
    key: shapeMoveKey,

    // -- State -------------------------------------------------------------------
    state: {
      init(_, state) { return new ShapeMove(false/*default shapeMove disabled*/); },
      apply(transaction, thisPluginState, oldState, newState) { return thisPluginState.apply(transaction, thisPluginState, oldState, newState); },
    },

    // -- Props -------------------------------------------------------------------
    props: {
      // .. Modify View ...........................................................
      attributes(state) {/*currently nothing*/},

      // .. Handler ...............................................................
      handleDOMEvents: { keydown(view, event) { return handleKeyDown(view, event); } },
    },

    appendTransaction: (transaction, oldState, newState) => {
      const { selection } = newState;
      const { tr } = newState;
      if(!isNodeSelection(selection) || selection.node.type.name !== NodeName.RECTANGLE) {
        tr.setMeta(shapeMoveKey, { shapeMoveEnabled: false });
        return tr;
      } /* else -- a shape is selected */

      tr.setMeta(shapeMoveKey, { shapeMoveEnabled: true });
      return tr;
    },
  });

  return plugin;
};

// == Handler =====================================================================
const handleKeyDown = ( view: EditorView, event: KeyboardEvent): boolean => {
  const { dispatch, state } = view,
        { tr } = state;

  const movementState = getShapeMoveState(state);
  if(!movementState.shapeMoveEnabled || !isNodeSelection(state.selection)) return false;
  if((event.ctrlKey || event.metaKey) && (event.key === KeyDown.Z || event.key === KeyDown.z)) return false/*let PM handle undo redo*/;
  if((event.ctrlKey || event.metaKey) && (event.key === KeyDown.C || event.key === KeyDown.c)) return false/*let PM handle copy*/;
  if((event.ctrlKey || event.metaKey) && (event.key === KeyDown.V || event.key === KeyDown.v)) return false/*let PM handle paste*/;
  if((event.ctrlKey || event.metaKey) && (event.key === KeyDown.X || event.key === KeyDown.x)) return false/*consequences handled by another plugin (SEE: shapeCut.ts)*/;

  preventDefaults(event);
  const rectangleType = state.schema.rectangle,
        { selection } = state,
        { attrs } = selection.node,
        { pos } = selection.$anchor;

  const delta = event.shiftKey ? Delta.Big : Delta.Small;
  switch(event.key) {
    case KeyDown.Up:
      tr.setNodeMarkup(pos, rectangleType, { ...attrs, centerY: attrs.centerY - delta });
      break;
    case KeyDown.Right:
      tr.setNodeMarkup(pos, rectangleType, { ...attrs, centerX: attrs.centerX + delta });
      break;
    case KeyDown.Down:
      tr.setNodeMarkup(pos, rectangleType, { ...attrs, centerY: attrs.centerY + delta });
      break;
    case KeyDown.Left:
      tr.setNodeMarkup(pos, rectangleType, { ...attrs, centerX: attrs.centerX - delta });
      break;
  }

  dispatch(tr);
  return true;
};

// == Util ========================================================================
// -- Metadata --------------------------------------------------------------------
const getShapeMoveState = (state: EditorState<any>) => shapeMoveKey.getState(state) as ShapeMove/*by contract*/;
const getShapeMoveMeta = (tr: Transaction): ShapeMoveMeta  => {
  const meta = tr.getMeta(shapeMoveKey);
  if(!isShapeMoveMeta(meta)) return { shapeMoveEnabled: false/*by definition*/ };
  return meta;
};

// -- Type Guard ------------------------------------------------------------------
const isShapeMoveMeta = (object: any): object is ShapeMoveMeta => object && 'shapeMoveEnabled' in object;

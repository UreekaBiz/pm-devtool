import { callOrReturn, getExtensionField, Node } from '@tiptap/core';

import { AttributeType, DrawingNodeSpec, DrawingStorage, NodeName, SetAttributeType, DRAWING_ID, DRAWING_VIEWBOX, DRAWING_WIDTH, DRAWING_HEIGHT, DRAWING_PRESERVE_ASPECT_RATIO } from 'common';

import { NoOptions } from 'notebookEditor/model/type';
import { getNodeOutputSpec, setAttributeParsingBehavior } from 'notebookEditor/extension/util/attribute';
import { findLastNodeByID } from 'notebookEditor/extension/util/node';

import { isGetPos } from '../util/ui';
import { ShapeIdentifier } from '../type';
import { getDrawingStorage, insertDrawing, insertRectangle, setDrawingTool, updateShapeAttributes } from './command';
import { DrawingView } from './DrawingView';

// ********************************************************************************
// == Node ========================================================================
export const Drawing = Node.create<NoOptions, DrawingStorage>({
  ...DrawingNodeSpec,

  // -- Attribute ----------------------------------------------------------------
  addAttributes() {
    return {
      // -- Logic -----------------------------------------------------------------
      [AttributeType.Id]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STRING, DRAWING_ID),

      // -- UI --------------------------------------------------------------------
      [AttributeType.ViewBox]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STRING, DRAWING_VIEWBOX),
      [AttributeType.Width]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STRING, DRAWING_WIDTH),
      [AttributeType.Height]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STRING, DRAWING_HEIGHT),
      [AttributeType.PreserveAspectRatio]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STRING, DRAWING_PRESERVE_ASPECT_RATIO),
    };
  },

  // -- Commands ------------------------------------------------------------------
  addCommands() {
    return {
      // -- Drawing ---------------------------------------------------------------
      insertDrawing: () => (commandProps) => { return insertDrawing(commandProps, undefined/*empty drawing*/); },
      setDrawingTool: (tool) => (commandProps) => { return setDrawingTool(commandProps, tool); },

      // -- Shape -----------------------------------------------------------------
      updateShapeAttributes: (shapeAttributes) => (commandProps) => { return updateShapeAttributes(commandProps, shapeAttributes); },

      // -- Rectangle -------------------------------------------------------------
      insertRectangle: (attributes) => (commandProps) => { return insertRectangle(commandProps, attributes); },
    };
  },

  // -- Update --------------------------------------------------------------------
  onUpdate() {
    const drawingStorage = getDrawingStorage(this.editor);
    drawingStorage.drawingViewMap.forEach(entry => {
      const id = entry.node.attrs.id;
      if(!id) throw new Error('Entry has no ID');

      const node = findLastNodeByID(this.editor.state.doc, id);
      if(!node) drawingStorage.drawingViewMap.delete(id);
      /* else -- it still exists, do nothing */
    });
  },

  // -- Storage -------------------------------------------------------------------
  addStorage(): DrawingStorage { return { drawingViewMap: new Map<ShapeIdentifier, DrawingView>() }; },
  extendNodeSchema(extension) { /*add drawingRole as a property that nodes can have*/
    const context = { name: extension.name, options: extension.options, storage: extension.storage };
    return { drawingRole: callOrReturn(getExtensionField(extension, 'drawingRole', context)) };
  },

  // -- View ----------------------------------------------------------------------
  addNodeView() {
    return ({ node, editor, getPos }) => {
      if(!isGetPos(getPos)) throw new Error('getPos is not a function when it should');
      const newDrawingView = new DrawingView(node, editor, getPos);

      const drawingStorage = getDrawingStorage(editor);
            drawingStorage.drawingViewMap.set(node.attrs.id, newDrawingView);

      return newDrawingView;
    };
  },
  parseHTML() { return [{ tag: NodeName.DRAWING }]; },
  renderHTML({ node, HTMLAttributes }) { return getNodeOutputSpec(node, HTMLAttributes); },
});

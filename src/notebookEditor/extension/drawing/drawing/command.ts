import { CommandProps, Editor } from '@tiptap/core';
import { Node as ProseMirrorNode, NodeType, Fragment } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';

import { DrawingAttributes, DrawingStorage, NotebookSchemaType, NodeName, RectangleAttributes,  DRAWING_VIEWBOX, DRAWING_WIDTH, DRAWING_HEIGHT, DRAWING_PRESERVE_ASPECT_RATIO } from 'common';

import { replaceAndSelectNode, selectionIsOfType, createFragmentWithAppendedContent, getNodeOffset, getResolvedAnchorPos, generateNodeId, isNodeSelection } from 'notebookEditor/extension/util/node';

import { ToolDefinition } from '../type';
import { DrawingView } from './DrawingView';

// ********************************************************************************
// == Type ========================================================================
// NOTE: Usage of ambient module to ensure command is TypeScript-registered
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [NodeName.DRAWING/*Expected and guaranteed to be unique. (SEE: /notebookEditor/model/node)*/]: {
      // -- Drawing ---------------------------------------------------------------
      /** Insert a Drawing and select it */
      insertDrawing: () => ReturnType;

      /** Set the tool that the drawing view is currently in */
      setDrawingTool: (tool: ToolDefinition) => ReturnType;

      // -- Shape -----------------------------------------------------------------
      updateShapeAttributes: (attributes: Partial<RectangleAttributes>) => ReturnType;

      // -- Rectangle -------------------------------------------------------------
      /** Insert an Rectangle and select it */
      insertRectangle: (attributes: RectangleAttributes) => ReturnType;
    };
  }
}

// == Implementation ==============================================================
// -- Drawing ---------------------------------------------------------------------
export const insertDrawing = (props: CommandProps, content: Fragment<NotebookSchemaType> | ProseMirrorNode<NotebookSchemaType> | Array<ProseMirrorNode<NotebookSchemaType>> | undefined): boolean => {
  const drawing = createDrawing(props.editor.schema, content);
  return replaceAndSelectNode(drawing, props.tr, props.dispatch);
};

export const setDrawingTool = (props: CommandProps, tool: ToolDefinition): boolean => {
  const currentView = getCurrentDrawingView(props.editor);
        currentView.setActiveTool(tool);
  return true;
};

// -- Shape -----------------------------------------------------------------------
export const updateShapeAttributes = (props: CommandProps, shapeAttributes: Partial<RectangleAttributes>) => {
  const  { id } = shapeAttributes;
  const { editor, state, tr, dispatch } = props,
        { selection } = editor.state;

  if(!dispatch) throw new Error('Dispatch function undefined when it should not');
  if(!isNodeSelection(selection) || selection.node.type.name !== NodeName.RECTANGLE) throw new Error(`Incorrect usage of updateShapeAttributes: expected shape but found ${selection}`);

  tr.selection.ranges.forEach(range => {
    const from = range.$from.pos,
          to = range.$to.pos;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if(node.attrs.id === id)
        tr.setNodeMarkup(pos, undefined/*preserve node type*/, { ...node.attrs, ...shapeAttributes });
      /* else -- do nothing */
    });
  });

  return true;
};

// -- Rectangle -------------------------------------------------------------------
export const insertRectangle = (props: CommandProps, attributes: RectangleAttributes) => {
  if(!props.dispatch) throw new Error('Dispatch function undefined when it should not');

  const { selection } = props.editor.state;
  if(!selectionIsOfType(selection, NodeName.DRAWING)) return false/*do not allow if not inside drawing*/;

  const rectangle = createRectangle(props.editor.schema, attributes),
        newDrawingNode = createDrawing(props.editor.schema, createFragmentWithAppendedContent(selection.node, rectangle)),
        newRectangleOffset = getNodeOffset(newDrawingNode, rectangle);

  const { tr, dispatch } = props;
        tr.replaceSelectionWith(newDrawingNode);

  const resolvedPos = getResolvedAnchorPos(tr, newRectangleOffset);
        tr.setSelection(new NodeSelection(resolvedPos));

  return dispatch(tr);
};

// == Creation ====================================================================
// -- Drawing ---------------------------------------------------------------------
export const createDrawing = (schema: NotebookSchemaType, content: Fragment<NotebookSchemaType> | ProseMirrorNode<NotebookSchemaType> | Array<ProseMirrorNode<NotebookSchemaType>> | undefined): ProseMirrorNode => {
  const types = getDrawingNodeTypes(schema);
  if(!types.drawing.create) throw new Error('Drawing create method not defined. Check that the correct name is being used');

  const drawingNode = types.drawing.create(({
    id: generateNodeId(),
    viewBox: DRAWING_VIEWBOX,
    width: DRAWING_WIDTH,
    height: DRAWING_HEIGHT,
    preserveAspectRatio: DRAWING_PRESERVE_ASPECT_RATIO,
  } as DrawingAttributes), content);

  return drawingNode;
};

// -- Rectangle -------------------------------------------------------------------
export const createRectangle = (schema: NotebookSchemaType, attributes: RectangleAttributes): ProseMirrorNode => {
  const types = getDrawingNodeTypes(schema);
  if(!types.rectangle.create) throw new Error('Rectangle create method not defined. Check that the correct name is being used');

  const rectangleNode = types.rectangle.create(attributes);
  return rectangleNode;
};

// == Util ========================================================================
export const getDrawingNodeTypes = (schema: NotebookSchemaType): { [key: string]: NodeType; } => {
  if(schema.cached.drawingRoles) {
    return schema.cached.drawingRoles;
  }

  const roles: { [key: string]: NodeType; } = {};
  Object.keys(schema.nodes).forEach(type => {
    const nodeType = schema.nodes[type];

    if(nodeType.spec.drawingRole/*NOTE: Must match name in DrawingManagement.ts extendNodeSchema call*/) {
      roles[nodeType.spec.drawingRole] = nodeType;
    }
  });

  schema.cached.drawingRoles = roles;
  return roles;
};

export const getDrawingStorage = (editor: Editor): DrawingStorage => {
  const drawingStorage = editor.storage[NodeName.DRAWING];
  if(!drawingStorage) throw new Error ('Drawing Storage not defined when it should');

  return drawingStorage as DrawingStorage/*by contract*/;
};

const getCurrentDrawingView = (editor: Editor): DrawingView => {
  const { selection } = editor.state;
  if(!isNodeSelection(selection) || !(selection.node.type.name === NodeName.DRAWING)) throw new Error('Running setCreateRectangleTool command outside of drawing');

  const selectedDrawingID = selection.node.attrs.id;
  const drawingStorage = getDrawingStorage(editor);

  const drawingView = drawingStorage.drawingViewMap.get(selectedDrawingID);
  if(!drawingView) throw new Error(`DrawingView for drawing ${selectedDrawingID} does not exist in drawingViewMap when it should by contract`);

  return drawingView;
};

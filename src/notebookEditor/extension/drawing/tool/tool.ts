import { RECTANGLE_TOOL_ID } from 'common';

import { MOUSE_TOOL_ID, MOUSE_CURSOR_CLASS, SHAPE_CURSOR } from '../constant';
import { DrawingView } from '../drawing/DrawingView';
import { ShapeType, ToolDefinition } from '../type';
import { CreateShapeTool } from './CreateShapeTool';
import { SelectionTool } from './selection/SelectionTool';

// ********************************************************************************
export const SelectionToolDefinition: ToolDefinition = {
  id: MOUSE_TOOL_ID,
  cursor: MOUSE_CURSOR_CLASS,
  createTool: (drawing: DrawingView) => new SelectionTool(drawing),
};

// -- Shapes ----------------------------------------------------------------------
export const RectangleToolDefinition: ToolDefinition = {
  id: RECTANGLE_TOOL_ID,
  cursor: SHAPE_CURSOR,
  createTool: (drawing: DrawingView) => new CreateShapeTool(drawing, ShapeType.Rectangle),
};

import { NodeName } from 'common';

import { MOUSE_CURSOR_CLASS, SHAPE_CURSOR } from '../constant';
import { SVGNodeView } from '../SVGNodeView';
import { SelectionTool } from './selection/SelectionTool';
import { ToolDefinition } from './type';
import { CreateShapeTool } from './CreateShapeTool';

// ********************************************************************************
// -- Selection -------------------------------------------------------------------
export const selectionToolDefinition: ToolDefinition = {
  cursor: MOUSE_CURSOR_CLASS,
  createTool: (svg: SVGNodeView) => new SelectionTool(svg),
};

// -- Shape -----------------------------------------------------------------------
// .. Rectangle ...................................................................
export const rectangleToolDefinition: ToolDefinition = {
  cursor: SHAPE_CURSOR,
  createTool: (svg: SVGNodeView) => new CreateShapeTool(svg, NodeName.RECTANGLE),
};

import { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { SOLID_FILL_STYLE, THIN_STROKE_WIDTH } from 'notebookEditor/extension/drawing/constant';
import { FillStyle, Roughness, ShapeStyle, StrokeStyle } from 'notebookEditor/extension/drawing/type';
import { colorToHexColor } from 'notebookEditor/theme/type';

import { noNodeSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { NodeIdentifier, NodeName } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
// -- Attribute -------------------------------------------------------------------
export const RECTANGLE_ID = 'Default Rectangle ID';
export const RECTANGLE_CENTER_X = 250;
export const RECTANGLE_CENTER_Y = 250;
export const RECTANGLE_WIDTH = 120;
export const RECTANGLE_HEIGHT = 120;
export const RECTANGLE_ANGLE = 0;
export const RECTANGLE_FILL = '0000FF'/*blue*/;
export const RECTANGLE_FILL_STYLE = SOLID_FILL_STYLE;
export const RECTANGLE_STROKE = '000000'/*black*/;
export const RECTANGLE_STROKE_STYLE = 'solid'/*default*/;
export const RECTANGLE_STROKE_WIDTH = THIN_STROKE_WIDTH/*default*/;
export const RECTANGLE_OPACITY = 1/*fill-opacity units*/;
export const RECTANGLE_ROUGHNESS = 0/*roughJS units*/;

// NOTE: This values must have matching types the ones defined in the Extension.
const RectangleAttributeSpec = {
  [AttributeType.Id]: noNodeSpecAttributeDefaultValue<NodeIdentifier>(),

  [AttributeType.CenterX]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.CenterY]: noNodeSpecAttributeDefaultValue<number>(),

  [AttributeType.Width]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Height]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Angle]: noNodeSpecAttributeDefaultValue<number>(),

  [AttributeType.Fill]: noNodeSpecAttributeDefaultValue<string>(),
  [AttributeType.FillStyle]: noNodeSpecAttributeDefaultValue<FillStyle>(),

  [AttributeType.Stroke]: noNodeSpecAttributeDefaultValue<string>(),
  [AttributeType.StrokeStyle]: noNodeSpecAttributeDefaultValue<StrokeStyle>(),
  [AttributeType.StrokeWidth]: noNodeSpecAttributeDefaultValue<number>(),

  [AttributeType.Opacity]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Roughness]: noNodeSpecAttributeDefaultValue<Roughness>(),
};
export type RectangleAttributes = AttributesTypeFromNodeSpecAttributes<typeof RectangleAttributeSpec>;

// ................................................................................
export const computeRectStyle = (attrs: RectangleAttributes): ShapeStyle => {
  let { roughness, stroke, strokeWidth, strokeStyle, fill, fillStyle, opacity } = attrs;
      stroke = colorToHexColor(stroke);
      fill = colorToHexColor(fill);
  return {
    roughness,
    stroke,
    strokeWidth,
    strokeStyle,
    fill,
    fillStyle,
    opacity,
  };
};

// ================================================================================
// -- Node Spec -------------------------------------------------------------------
export const RectangleNodeSpec: NodeSpec = {
  name: NodeName.RECTANGLE,
  drawingRole: NodeName.RECTANGLE,
};

// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way to ensure the right attributes will be available
//       since PM does not provide a way to specify their type
export type RectangleNodeType = ProseMirrorNode<NotebookSchemaType> & { attrs: RectangleAttributes; };
export const isRectangleNode = (node: ProseMirrorNode<NotebookSchemaType>): node is RectangleNodeType => node.type.name === NodeName.RECTANGLE;

// ================================================================================
// -- Render Spec -----------------------------------------------------------------
export const RectangleNodeRendererSpec: NodeRendererSpec<RectangleAttributes> = {
  tag: 'div',
  attributes: {/*TODO: Add attributes*/},
};

// == Tool ========================================================================
export const RECTANGLE_TOOL_ID = 'rectangleTool';
export const RECTANGLE_STROKE_TOOL = 'rectangleStrokeTool';
export const RECTANGLE_BACKGROUND_TOOL = 'rectangleBackgroundTool';
export const RECTANGLE_FILL_TOOL = 'rectangleFillTool';
export const RECTANGLE_STROKE_WIDTH_TOOL = 'rectangleStrokeWidthTool';
export const RECTANGLE_STROKE_STYLE_TOOL = 'rectangleStrokeStyleTool';
export const RECTANGLE_SLOPPINESS_TOOL = 'rectangleSloppinessTool';
export const RECTANGLE_EDGE_TOOL = 'rectangleEdgeTool';
export const RECTANGLE_OPACITY_TOOL = 'rectangleOpacityTool';

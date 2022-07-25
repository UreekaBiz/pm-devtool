import { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { createRandomHex } from 'notebookEditor/extension/svg/util';
import { generateNodeId } from 'notebookEditor/extension/util/node';

import { noNodeSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { NodeIdentifier, NodeName } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
export const isRectangleAttributes = (attrs: any): attrs is RectangleAttributes => 'centerX' in attrs && 'centerY' in attrs;

// ================================================================================
// -- Attribute -------------------------------------------------------------------
export const RECTANGLE_ID = 'Default Rectangle ID'/*FIXME: Cannot import DEFAULT_NODE_ID from uniqueNodeId*/;
export const RECTANGLE_CENTER_X = 120;
export const RECTANGLE_CENTER_Y = 120;
export const RECTANGLE_WIDTH = 120;
export const RECTANGLE_HEIGHT = 120;
export const RECTANGLE_ANGLE = 0;
export const RECTANGLE_FILL = '#0000FF'/*blue*/;
export const RECTANGLE_STROKE = '#000000'/*black*/;
export const RECTANGLE_STROKE_WIDTH = 3/*px*/;
export const RECTANGLE_OPACITY = 1/*fill-opacity units*/;

// NOTE: This values must have matching types the ones defined in the Extension.
const RectangleNodeAttributeSpec = {
  [AttributeType.Id]: noNodeSpecAttributeDefaultValue<NodeIdentifier>(),

  [AttributeType.CenterX]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.CenterY]: noNodeSpecAttributeDefaultValue<number>(),

  [AttributeType.Width]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Height]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Angle]: noNodeSpecAttributeDefaultValue<number>(),

  [AttributeType.Fill]: noNodeSpecAttributeDefaultValue<string>(),
  [AttributeType.Stroke]: noNodeSpecAttributeDefaultValue<string>(),
  [AttributeType.StrokeWidth]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Opacity]: noNodeSpecAttributeDefaultValue<number>(),
};
export type RectangleAttributes = AttributesTypeFromNodeSpecAttributes<typeof RectangleNodeAttributeSpec>;

// ................................................................................
export const createDefaultRectangleAttributes = (): RectangleAttributes =>
  ({
    id: generateNodeId(),

    centerX: RECTANGLE_CENTER_X,
    centerY: RECTANGLE_CENTER_Y,

    width: RECTANGLE_WIDTH,
    height: RECTANGLE_HEIGHT,
    angle: RECTANGLE_ANGLE,

    fill: createRandomHex(),

    stroke: RECTANGLE_STROKE,
    strokeWidth: RECTANGLE_STROKE_WIDTH,

    opacity: RECTANGLE_OPACITY,
  });

// ================================================================================
// -- Node Spec -------------------------------------------------------------------
export const RectangleNodeSpec: NodeSpec = {
  name: NodeName.RECTANGLE,
  selectable: true,
};

// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the attributes
export type RectangleNodeType = ProseMirrorNode<NotebookSchemaType> & { attrs: RectangleAttributes; };
export const isRectangleNode = (node: ProseMirrorNode<NotebookSchemaType>): node is RectangleNodeType => node.type.name === NodeName.RECTANGLE;

// ================================================================================
// -- Render Spec -----------------------------------------------------------------
export const RectangleNodeRendererSpec: NodeRendererSpec<RectangleAttributes> = {
  tag: 'div',
  attributes: {/*TODO: Add attributes*/},
};

// == Tool ========================================================================
export const RECTANGLE_INFO_TOOL_UI = 'rectangleInfoToolUI';
export const RECTANGLE_ORDER_TOOL_UI = 'rectangleOrderToolUI';

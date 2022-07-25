import { Node } from '@tiptap/core';

import { AttributeType, NodeName, RectangleNodeSpec, SetAttributeType, RECTANGLE_CENTER_X, RECTANGLE_CENTER_Y, RECTANGLE_FILL, RECTANGLE_FILL_STYLE, RECTANGLE_HEIGHT, RECTANGLE_ID, RECTANGLE_OPACITY, RECTANGLE_ROUGHNESS, RECTANGLE_STROKE, RECTANGLE_STROKE_STYLE, RECTANGLE_STROKE_WIDTH, RECTANGLE_WIDTH } from 'common';

import { getNodeOutputSpec, setAttributeParsingBehavior } from 'notebookEditor/extension/util/attribute';

// ********************************************************************************
// == Node ========================================================================
export const Rectangle = Node.create({
  ...RectangleNodeSpec,

  // -- Attribute -----------------------------------------------------------------
  addAttributes() {
    return {
      // -- Logic -----------------------------------------------------------------
      [AttributeType.Id]: setAttributeParsingBehavior(AttributeType.Id, SetAttributeType.STRING, RECTANGLE_ID),

      // -- UI --------------------------------------------------------------------
      [AttributeType.CenterX]: setAttributeParsingBehavior(AttributeType.CenterX, SetAttributeType.NUMBER, RECTANGLE_CENTER_X),
      [AttributeType.CenterY]: setAttributeParsingBehavior(AttributeType.CenterY, SetAttributeType.NUMBER, RECTANGLE_CENTER_Y),

      [AttributeType.Width]: setAttributeParsingBehavior(AttributeType.Width, SetAttributeType.NUMBER, RECTANGLE_WIDTH),
      [AttributeType.Height]: setAttributeParsingBehavior(AttributeType.Height, SetAttributeType.NUMBER, RECTANGLE_HEIGHT),
      [AttributeType.Angle]: setAttributeParsingBehavior(AttributeType.Angle, SetAttributeType.NUMBER, RECTANGLE_HEIGHT),

      [AttributeType.Fill]: setAttributeParsingBehavior(AttributeType.Fill, SetAttributeType.STRING, RECTANGLE_FILL),
      [AttributeType.FillStyle]: setAttributeParsingBehavior(AttributeType.FillStyle, SetAttributeType.STRING, RECTANGLE_FILL_STYLE),

      [AttributeType.Stroke]: setAttributeParsingBehavior(AttributeType.Stroke, SetAttributeType.STRING, RECTANGLE_STROKE),
      [AttributeType.StrokeWidth]: setAttributeParsingBehavior(AttributeType.StrokeWidth, SetAttributeType.STRING, RECTANGLE_STROKE_WIDTH),
      [AttributeType.StrokeStyle]: setAttributeParsingBehavior(AttributeType.StrokeStyle, SetAttributeType.STRING, RECTANGLE_STROKE_STYLE),

      [AttributeType.Opacity]: setAttributeParsingBehavior(AttributeType.Opacity, SetAttributeType.STRING, RECTANGLE_OPACITY),
      [AttributeType.Roughness]: setAttributeParsingBehavior(AttributeType.Roughness, SetAttributeType.STRING, RECTANGLE_ROUGHNESS),
    };
  },

  // -- View ----------------------------------------------------------------------
  parseHTML() { return [ { tag: NodeName.RECTANGLE } ]; },
  renderHTML({ node, HTMLAttributes }) { return getNodeOutputSpec(node, HTMLAttributes); },
});

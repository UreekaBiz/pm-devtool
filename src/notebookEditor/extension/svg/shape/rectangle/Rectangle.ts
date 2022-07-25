import { mergeAttributes, Node } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';

import { AttributeType, NotebookSchemaType, NodeName, RectangleAttributes, RectangleNodeSpec, SetAttributeType, RECTANGLE_CENTER_X, RECTANGLE_CENTER_Y, RECTANGLE_FILL, RECTANGLE_HEIGHT, RECTANGLE_ID, RECTANGLE_OPACITY, RECTANGLE_STROKE, RECTANGLE_STROKE_WIDTH, RECTANGLE_WIDTH, RECTANGLE_ANGLE } from 'common';

import { NoOptions, NoStorage } from 'notebookEditor/model/type';
import { setAttributeParsingBehavior } from 'notebookEditor/extension/util/attribute';
import { NodeContent } from 'notebookEditor/extension/util/node';

// ********************************************************************************
// == Node ========================================================================
export const Rectangle = Node.create<NoOptions, NoStorage>({
  ...RectangleNodeSpec,

  addAttributes() {
    return {
      // -- Logic -----------------------------------------------------------------
      [AttributeType.Id]: setAttributeParsingBehavior(AttributeType.Id, SetAttributeType.STRING, RECTANGLE_ID),

      // -- UI --------------------------------------------------------------------
      [AttributeType.CenterX]: setAttributeParsingBehavior(AttributeType.CenterX, SetAttributeType.NUMBER, RECTANGLE_CENTER_X),
      [AttributeType.CenterY]: setAttributeParsingBehavior(AttributeType.CenterY, SetAttributeType.NUMBER, RECTANGLE_CENTER_Y),

      [AttributeType.Width]: setAttributeParsingBehavior(AttributeType.Width, SetAttributeType.NUMBER, RECTANGLE_WIDTH),
      [AttributeType.Height]: setAttributeParsingBehavior(AttributeType.Height, SetAttributeType.NUMBER, RECTANGLE_HEIGHT),
      [AttributeType.Angle]: setAttributeParsingBehavior(AttributeType.Angle, SetAttributeType.NUMBER, RECTANGLE_ANGLE),

      [AttributeType.Fill]: setAttributeParsingBehavior(AttributeType.Fill, SetAttributeType.STRING, RECTANGLE_FILL),
      [AttributeType.Stroke]: setAttributeParsingBehavior(AttributeType.Stroke, SetAttributeType.STRING, RECTANGLE_STROKE),

      [AttributeType.StrokeWidth]: setAttributeParsingBehavior(AttributeType.Stroke, SetAttributeType.NUMBER, RECTANGLE_STROKE_WIDTH),
      [AttributeType.Opacity]: setAttributeParsingBehavior(AttributeType.Stroke, SetAttributeType.NUMBER, RECTANGLE_OPACITY),
    };
  },

  parseHTML() { return [{ tag: NodeName.RECTANGLE }]; },
  renderHTML({ HTMLAttributes }) { return [NodeName.RECTANGLE, mergeAttributes(HTMLAttributes)/*add attrs to pasted html*/]; },
});

// --------------------------------------------------------------------------------
export const createRectangleNode = (schema: NotebookSchemaType, attributes: RectangleAttributes, content: NodeContent | undefined): ProseMirrorNode =>
  schema.nodes.rectangle.create(attributes, content);

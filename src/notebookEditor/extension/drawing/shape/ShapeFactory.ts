import { DEFAULT_SHAPE_STYLE } from '../constant';
import { DrawingView } from '../drawing/DrawingView';
import { Shape, ShapeElement } from './Shape';
import { RectangleElement, RectangleShape } from './rectangle/RectangleShape';
import { ShapeIdentifier, ShapeType } from '../type';
import { Box } from '../util/math';

// ********************************************************************************
// factory for creating concrete SVG shapes based on {@link ShapeType}
export class ShapeFactory {
  public static createModel(id: ShapeIdentifier, shapeType: ShapeType, initialBox: Box, initialAngle: number): Shape {
    switch(shapeType) {
      // case ShapeType.Ellipse: return new Ellipse(id, shapeStyle, initialBox);
      // case ShapeType.Line: return new Line(id, shapeStyle, initialBox);
      case ShapeType.Rectangle: return new RectangleShape(id, DEFAULT_SHAPE_STYLE, initialBox, initialAngle);
    }
  }

  // ==============================================================================
  public static createElement(drawing: DrawingView, shapeType: ShapeType, id: ShapeIdentifier, shape: Shape): ShapeElement {
    switch(shapeType) {
      // case ShapeType.Ellipse: return new EllipseElement(svgEditor, shape);
      // case ShapeType.Line: return new LineElement(svgEditor, shape);
      case ShapeType.Rectangle: return new RectangleElement(drawing, shape, id);
    }
  }
}

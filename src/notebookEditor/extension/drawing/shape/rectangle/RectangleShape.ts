import { SHAPE_G } from '../../constant';
import { ShapeIdentifier, ShapeStyle, ShapeType } from '../../type';
import { Box } from '../../util/math';
import { styleToCSSString, styleToRoughJS } from '../../util/style';
import { Shape, ShapeElement } from '../Shape';

// ** Model ***********************************************************************
export class RectangleShape extends Shape {
  // === Lifecycle ================================================================
  public constructor(id: ShapeIdentifier, style: ShapeStyle, initialBox: Box, initialAngle: number) {
    super(id,
          ShapeType.Rectangle/*by definition*/,
          style,
          initialBox,
          initialAngle);
  }
}

// ** View ************************************************************************
export class RectangleElement extends ShapeElement {
  protected createShape(shape: Shape, shapeID: ShapeIdentifier): SVGGraphicsElement {
    const dimension = shape.dimension/*for convenience*/;
    const rectG = this.drawing.roughSVG.draw(this.drawing.roughGenerator.rectangle(-(dimension.width / 2), -(dimension.height / 2), dimension.width, dimension.height, styleToRoughJS(shape.style)));
          rectG.setAttribute('id', `${SHAPE_G}-${shapeID}`);
          rectG.setAttribute('style', styleToCSSString(shape.style));
    return rectG;
  }
}

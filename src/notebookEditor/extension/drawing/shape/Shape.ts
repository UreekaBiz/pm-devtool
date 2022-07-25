import { DrawingView } from '../drawing/DrawingView';
import { ShapeIdentifier, ShapeStyle, ShapeType } from '../type';
import { computeCenterDimensionFromBox, Box, Dimension, Point, computeDegrees } from '../util/math';

// ** Model ***********************************************************************
export abstract class Shape {
  public readonly id: ShapeIdentifier;
  public readonly type: ShapeType;

  public style: ShapeStyle;

  // the location of the center of the bounding box of the shape
  public center: Point;
  // the dimensions of the bounding box of this shape
  public dimension: Dimension;
  // how much is the shape rotated about the center of the bounding box of the shape
  public angle: number;

  // === Lifecycle ================================================================
  public constructor(id: ShapeIdentifier, type: ShapeType, style: ShapeStyle, initialBox: Box, initialAngle: number) {
    this.id = id;
    this.type = type;

    this.style = style;

    const { center, dimension } = computeCenterDimensionFromBox(initialBox);
    this.center = center;
    this.dimension = dimension;
    this.angle = initialAngle;
  }

  // == Move / Resize / Rotate ====================================================
  public move(centerPosition: Point) {
    this.center.x = centerPosition.x;
    this.center.y = centerPosition.y;
  }

  public resize(location: Point, dimension: Dimension) {
    this.center.x = location.x;
    this.center.y = location.y;
    this.dimension.width  = dimension.width;
    this.dimension.height = dimension.height;
  }

  // TODO: specify if about origin or center
  public rotate(angle: number) {
    this.angle = angle;
  }
}

// ** View ************************************************************************
// TODO: rename? ShapeVisual?
export abstract class ShapeElement {
  public element: SVGGraphicsElement;

  // === Lifecycle ================================================================
  public constructor(protected drawing: DrawingView, shape: Shape, shapeID: ShapeIdentifier) {
    this.element = this.update(shape, shapeID);
  }

  // == Update ====================================================================
  /**
   * Shapes have their origin at the center of their bounding box.
   *
   * @param shape the {@link Shape} that defines where the visual is initially
   *        positioned
   */
  protected abstract createShape(shape: Shape, shapeID: ShapeIdentifier): SVGGraphicsElement;

  /**
   * Updates the current element to the specified {@link Shape}. This must be used
   * when resizing or changing styles. If the shape has only been moved or rotated
   * then {@link #moveRotate(Shape)} should be used.
   *
   * @param shape the current {@link Shape} to be updated to
   * @see #moveRotate(Shape)
   */
  public update(shape: Shape, shapeID: ShapeIdentifier): SVGGraphicsElement/*for convenience*/ {
    this.element = this.createShape(shape, shapeID);

    const translateTransform = this.drawing.createSVGTransform();
          translateTransform.setTranslate(shape.center.x, shape.center.y);
    this.element.transform.baseVal.appendItem(translateTransform);
    const rotateTransform = this.drawing.createSVGTransform();
          rotateTransform.setRotate(computeDegrees(shape.angle), 0, 0);
    this.element.transform.baseVal.appendItem(rotateTransform);

    return this.element;
  }

  // ------------------------------------------------------------------------------
  /**
   * If the {@link Shape} was only moved and/or rotated then this can be used to
   * update the visual.
   *
   * @param shape the current {@link Shape} to be moved and/or rotated to
   * @see #update(Shape)
   */
  public moveRotate(shape: Shape) {
    if(this.element.transform.baseVal.length < 2) throw new Error(`No Shape SVG transform for ${shape.type} '${shape.id}'`);
    this.element.transform.baseVal.getItem(0).setTranslate(shape.center.x, shape.center.y);
    this.element.transform.baseVal.getItem(1).setRotate(computeDegrees(shape.angle), 0, 0);
  }
}

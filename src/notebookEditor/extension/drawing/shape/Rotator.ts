import { ROTATOR_DISTANCE, ROTATOR_RADIUS, SVGNS } from '../constant';
import { CircleStyle, ShapeIdentifier } from '../type';
import { Dimension, Point } from '../util/math';
import { cssVisible, toCSSString } from '../util/style';
import { createShapeRotatorId } from '../util/ui';

// ********************************************************************************
// == Constant ====================================================================
export const rotatorStyle: CircleStyle = {
  'visibility': 'hidden',

  'fill': 'transparent',
  'stroke': 'black',
  'stroke-width': '2px',
  'stroke-dasharray': '0',
  'opacity': '1',
  'cursor': 'grab',
};
export const ROTATOR_CLASS = 'rotator';

// NOTE: the rotator is relative to the origin (since the parent selection 'G' will
//       handles the position and rotation)
// ** Model ***********************************************************************
export class Rotator {
  public readonly style: CircleStyle;

  // the origin of the rotator (with respect to the parent selection 'G' whose
  // origin is centered within the bounding box of the associated shape)
  public origin: Point;

  // === Lifecycle ================================================================
  public constructor(dimension: Dimension) {
    this.style = { ...rotatorStyle/*default style*/ },
    this.setVisible(false/*default hidden*/);

    this.origin = Rotator.computeRotatorPosition(dimension);
  }

  // == Visibility ================================================================
  public setVisible(visible: boolean) {
    this.style.visibility = cssVisible(visible);
  }

  // == Resize ====================================================================
  // NOTE: no move or rotate since handled by parent selection 'G'
  public resize(dimension: Dimension) {
    this.origin = Rotator.computeRotatorPosition(dimension);
  }

  // ------------------------------------------------------------------------------
  private static computeRotatorPosition(dimension: Dimension): Point {
    return { x: 0, y: -((dimension.height / 2) + ROTATOR_DISTANCE) };
  }
}

// ** View ************************************************************************
export class RotatorElement {
  public readonly element: SVGGraphicsElement;

  // === Lifecycle ================================================================
  public constructor(id: ShapeIdentifier, rotator: Rotator) {
    const element = document.createElementNS(SVGNS, 'circle');
          element.classList.add(ROTATOR_CLASS);
          element.setAttribute('id', createShapeRotatorId(id));
          element.setAttribute('r', ROTATOR_RADIUS.toString());
          element.setAttribute('cx', rotator.origin.x.toString());
          element.setAttribute('cy', rotator.origin.y.toString());
          element.setAttribute('style', toCSSString(rotator.style));
    this.element = element;
  }

  // == Update ====================================================================
  public update(rotator: Rotator) {
    this.element.setAttribute('cx', rotator.origin.x.toString());
    this.element.setAttribute('cy', rotator.origin.y.toString());
    this.element.setAttribute('style', toCSSString(rotator.style));
  }
}

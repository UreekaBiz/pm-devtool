import { MIN_RESIZER_DISTANCE, RESIZER_SIDE_LENGTH, SVGNS } from '../constant';
import { CSSStyle, ShapeIdentifier } from '../type';
import { Dimension, Point } from '../util/math';
import { cssVisible, toCSSString } from '../util/style';
import { createShapeResizerId } from '../util/ui';

// ********************************************************************************
// ** Model ***********************************************************************
export class Resizers implements Record<ResizerLocation, Resizer> {
  // clockwise
  // CHECK: any way to tighten this up based on Record<...>?
  public readonly topLeft: Resizer;
  public readonly topMiddle: Resizer;
  public readonly topRight: Resizer;

  public readonly middleRight: Resizer;

  public readonly bottomRight: Resizer;
  public readonly bottomMiddle: Resizer;
  public readonly bottomLeft: Resizer;

  public readonly middleLeft: Resizer;

  // ..............................................................................
  // needed to compute Resizer visibility on setVisible()
  private dimension: Dimension;

  // === Lifecycle ================================================================
  public constructor(dimension: Dimension) {
    // CHECK: any way to do this (rather than explicit below) in TypeScript?
    // Object.values(ResizerLocation).forEach(location => this[location] = new Resizer(location));
    this.topLeft = new Resizer(ResizerLocation.TOP_LEFT);
    this.topMiddle = new Resizer(ResizerLocation.TOP_MIDDLE);
    this.topRight = new Resizer(ResizerLocation.TOP_RIGHT);
    this.middleRight = new Resizer(ResizerLocation.MIDDLE_RIGHT);
    this.bottomRight = new Resizer(ResizerLocation.BOTTOM_RIGHT);
    this.bottomMiddle = new Resizer(ResizerLocation.BOTTOM_MIDDLE);
    this.bottomLeft = new Resizer(ResizerLocation.BOTTOM_LEFT);
    this.middleLeft = new Resizer(ResizerLocation.RIGHT_MIDDLE);

    this.dimension = { ...dimension }/*clone for sanity*/;
    this.resize(dimension);
  }

  // == Visibility ================================================================
  public setVisible(visible: boolean) {
    // set all Resizer's to visible / hidden
    Object.values(ResizerLocation).forEach(location => this[location].setVisible(visible));

    // if making visible then compute if any Resizer shouldn't be shown
    if(visible) this.computeVisibility(this.dimension);
  }

  // ..............................................................................
  // computes if some of the resizers shouldn't be shown (only to be used in the
  // case of #setVisible(true))
  // NOTE: the better approach might be just to preserve a flag for each Resizer
  private computeVisibility(dimension: Dimension) {
    const showHorizontalMiddle = dimension.width  > MIN_RESIZER_DISTANCE,
          showVerticalMiddle   = dimension.height > MIN_RESIZER_DISTANCE;

    this.topMiddle.style.visibility = cssVisible(showHorizontalMiddle);
    this.middleRight.style.visibility = cssVisible(showVerticalMiddle);
    this.bottomMiddle.style.visibility = cssVisible(showHorizontalMiddle);
    this.middleLeft.style.visibility = cssVisible(showVerticalMiddle);
  }

  // == Resize ====================================================================
  // NOTE: no move or rotate since handled by parent selection 'G'
  public resize(dimension: Dimension) {
    this.dimension = dimension;
    this.computeVisibility(dimension);

    const top = -(dimension.height / 2) - RESIZER_SIDE_LENGTH,
          left = -(dimension.width / 2) - RESIZER_SIDE_LENGTH,
          bottom  = dimension.height / 2,
          right = dimension.width / 2,
          middleX = -RESIZER_SIDE_LENGTH / 2,
          middleY = -RESIZER_SIDE_LENGTH / 2;

    this.topLeft.resize({ x: left, y: top });
    this.topMiddle.resize({ x: middleX, y: top });
    this.topRight.resize({ x: right, y: top });

    this.middleRight.resize({ x: right, y: middleY });

    this.bottomRight.resize({ x: right, y: bottom });
    this.bottomMiddle.resize({ x: middleX, y: bottom });
    this.bottomLeft.resize({ x: left, y: bottom });

    this.middleLeft.resize({ x: left, y: middleY });
  }
}

// ================================================================================
export class Resizer {
  // FIXME: decouple CSS class (which defines which pointer to use) from the resizer
  //        since when rotating, the direction (visually) changes
  public readonly location: ResizerLocation;

  public readonly style: CSSStyle;

  // the origin of the rotator (with respect to the parent selection 'G' whose
  // origin is centered within the bounding box of the associated shape)
  public readonly origin: Point;

  // === Lifecycle ================================================================
  public constructor(location: ResizerLocation) {
    this.location = location;

    this.style = { ...resizerStyle/*default style*/ }/*clone*/;
    this.setVisible(false/*default hidden*/);

    this.origin = { x: 0, y: 0 }/*will be moved into position after creation*/;
  }

  // == Visibility ================================================================
  public setVisible(visible: boolean) {
    this.style.visibility = cssVisible(visible);
  }

  // == Resize ====================================================================
  // NOTE: no move or rotate since handled by parent selection 'G'
  public resize(origin: Point) {
    this.origin.x = origin.x;
    this.origin.y = origin.y;
  }
}

// ** View ************************************************************************
export class ResizerElement {
  public readonly element: SVGGraphicsElement;

  // === Lifecycle ================================================================
  public constructor(id: ShapeIdentifier, resizer: Resizer) {
    const element = document.createElementNS(SVGNS, 'rect');
          element.classList.add(resizer.location);
          element.setAttribute('id', createShapeResizerId(id, resizer.location));
          element.setAttribute('x', resizer.origin.x.toString());
          element.setAttribute('y', resizer.origin.y.toString());
          element.setAttribute('width', RESIZER_SIDE_LENGTH.toString());
          element.setAttribute('height', RESIZER_SIDE_LENGTH.toString());
          element.setAttribute('style', toCSSString(resizer.style));
    this.element = element;
  }

  // ------------------------------------------------------------------------------
  public static createResizerElements(id: ShapeIdentifier, resizers: Resizers) {
    return Object.fromEntries(Object.values(ResizerLocation).map(location => ([location, new ResizerElement(id, resizers[location])]))) as Record<ResizerLocation, ResizerElement>;
  }

  // == Update ====================================================================
  public update(resizer: Resizer) {
    this.element.setAttribute('x', resizer.origin.x.toString());
    this.element.setAttribute('y', resizer.origin.y.toString());
    // NOTE: width and height are fixed
    this.element.setAttribute('style', toCSSString(resizer.style));
  }

  // ------------------------------------------------------------------------------
  public static updateResizerElements(resizers: Resizers, elements: Record<ResizerLocation, ResizerElement>) {
    Object.values(ResizerLocation).forEach(location => elements[location].update(resizers[location]));
  }
}

// == Constant ====================================================================
// NOTE: resizers are relative to the origin (since the parent selector 'G' will
//       handles the position and rotation)
export enum ResizerLocation {
  // clockwise from upper-left
  TOP_LEFT = 'topLeft',
  TOP_MIDDLE = 'topMiddle',
  TOP_RIGHT = 'topRight',

  MIDDLE_RIGHT = 'middleRight',

  BOTTOM_LEFT = 'bottomLeft',
  BOTTOM_MIDDLE = 'bottomMiddle',
  BOTTOM_RIGHT = 'bottomRight',

  RIGHT_MIDDLE = 'middleLeft',
}

const resizerLocationLookup = new Set<string/*explicitly for lookup*/>(Object.values(ResizerLocation));
export const isResizerLocation = (s: string): s is ResizerLocation => resizerLocationLookup.has(s);
export const resizerStyle: CSSStyle = {
  'visibility': 'hidden',

  'fill': 'transparent',
  'stroke': 'black',
  'stroke-width': '2px',
  'stroke-dasharray': '0',
  'opacity': '1',
} as const;

// == Util ========================================================================
// TODO: push this down to Resizer itself rather than computing each time
export const isTop =    (location: ResizerLocation) => (location === ResizerLocation.TOP_LEFT)    || (location === ResizerLocation.TOP_MIDDLE)    || (location === ResizerLocation.TOP_RIGHT);
export const isBottom = (location: ResizerLocation) => (location === ResizerLocation.BOTTOM_LEFT) || (location === ResizerLocation.BOTTOM_MIDDLE) || (location === ResizerLocation.BOTTOM_RIGHT);
export const isLeft =   (location: ResizerLocation) => (location === ResizerLocation.TOP_LEFT)    || (location === ResizerLocation.RIGHT_MIDDLE)  || (location === ResizerLocation.BOTTOM_LEFT);
export const isRight =  (location: ResizerLocation) => (location === ResizerLocation.TOP_RIGHT)   || (location === ResizerLocation.MIDDLE_RIGHT)  || (location === ResizerLocation.BOTTOM_RIGHT);


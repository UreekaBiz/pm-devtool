import { hiddenSelectionStyle, visibleSelectionStyle, SHAPE_SELECTION_PADDING, SVGNS, SELECTION_G } from '../constant';
import { CSSStyle, ShapeIdentifier } from '../type';
import { computeDegrees, computeOrientedPaddedDimension, Dimension, Point } from '../util/math';
import { toCSSString } from '../util/style';
import { createShapeSelectionId } from '../util/ui';
import { ResizerElement, ResizerLocation, Resizers } from './Resizer';
import { Rotator, RotatorElement } from './Rotator';

// ********************************************************************************
// NOTE: selections are padded out from the shape's bounding box and they are
//       always correctly oriented! Selections are centered within the bounding
//       box of the associated shape
// ** Model ***********************************************************************
export class ShapeSelection {
  public style: CSSStyle;

  // the location of the center of the selection
  public readonly center: Point;
  // the (outward) padded dimensions of the selection (these are always positive)
  public readonly dimension: Dimension;
  // the rotation about the center
  public angle: number;

  public readonly rotator: Rotator;
  public readonly resizers: Resizers;

  // === Lifecycle ================================================================
  public constructor(center: Point, dimension: Dimension, angle: number) {
    const orientedPaddedDimension = computeOrientedPaddedDimension(dimension, SHAPE_SELECTION_PADDING);

    this.style = { ...hiddenSelectionStyle/*default hidden*/ };

    this.center = { ...center }/*clone for sanity*/;
    this.dimension = orientedPaddedDimension;
    this.angle = angle;

    this.rotator = new Rotator(orientedPaddedDimension);
    this.resizers = new Resizers(orientedPaddedDimension);
  }

  // == Visibility ================================================================
  public setVisible(visible: boolean) {
    this.style = visible
                  ? { ...visibleSelectionStyle }
                  : { ...hiddenSelectionStyle };

    this.rotator.setVisible(visible);
    this.resizers.setVisible(visible);
  }

  // == Move / Resize / Rotate ====================================================
  public move(centerPosition: Point) {
    this.center.x = centerPosition.x;
    this.center.y = centerPosition.y;

    // NOTE: the (parent) selection 'G' translates everything together so no need to
    //       explicitly translate the resizers or rotators
  }

  public resize(center: Point, dimension: Dimension) {
    const orientedPaddedDimension = computeOrientedPaddedDimension(dimension, SHAPE_SELECTION_PADDING);

    this.center.x = center.x;
    this.center.y = center.y;
    this.dimension.width = orientedPaddedDimension.width;
    this.dimension.height = orientedPaddedDimension.height;

    this.rotator.resize(orientedPaddedDimension);
    this.resizers.resize(orientedPaddedDimension);
  }

  public rotate(angle: number) {
    this.angle = angle;

    // NOTE: the (parent) selection 'G' rotates everything together so no need to
    //       explicitly resize the resizers or rotators
  }
}

// ** View ************************************************************************
export class ShapeSelectionElement {
  public readonly selectionG: SVGGElement;
  private readonly element: SVGGraphicsElement;

  private readonly resizers: Record<ResizerLocation, ResizerElement>;
  private readonly rotator: RotatorElement;

  // === Lifecycle ================================================================
  public constructor(drawingCanvas: SVGSVGElement, id: ShapeIdentifier, selection: ShapeSelection) {
    this.selectionG = ShapeSelectionElement.createGElement(drawingCanvas, id, selection.center, selection.angle);

    const dimension = selection.dimension/*for convenience*/;
    const element = document.createElementNS(SVGNS, 'rect'/*selection is always rect*/);
          element.setAttribute('id', createShapeSelectionId(id));
          element.setAttribute('x', (-dimension.width / 2).toString());
          element.setAttribute('y', (-dimension.height / 2).toString());
          element.setAttribute('width', dimension.width.toString());
          element.setAttribute('height', dimension.height.toString());
          element.setAttribute('style', toCSSString(selection.style));
    this.selectionG.appendChild(element);
    this.element = element;

    this.rotator = new RotatorElement(id, selection.rotator);
    this.selectionG.appendChild(this.rotator.element);

    this.resizers = ResizerElement.createResizerElements(id, selection.resizers);
    Object.values(ResizerLocation).forEach(location => this.selectionG.appendChild(this.resizers[location].element));
  }

  // --------------------------------------------------------------------------------
  private static createGElement(drawingCanvas: SVGSVGElement, id: ShapeIdentifier, center: Point, angle: number): SVGGElement {
    // the selection is draw from the origin which means that it needs to be translated
    // up and to the left by the padding
    const selectionG = document.createElementNS(SVGNS, 'g');
          selectionG.setAttribute('id', `${SELECTION_G}-${id}`);

          const translateTransform = drawingCanvas.createSVGTransform();
                translateTransform.setTranslate(center.x, center.y);
          selectionG.transform.baseVal.appendItem(translateTransform);
          const rotateTransform = drawingCanvas.createSVGTransform();
                rotateTransform.setRotate(computeDegrees(angle), 0, 0);
          selectionG.transform.baseVal.appendItem(rotateTransform);

    return selectionG;
  }

  // == Update ====================================================================
  public update(selection: ShapeSelection) {
    // rotate (parent) selection 'G'
    if(this.selectionG.transform.baseVal.length < 2) throw new Error(`No Selection G SVG transform for content`);
    this.selectionG.transform.baseVal.getItem(0).setTranslate(selection.center.x, selection.center.y);
    this.selectionG.transform.baseVal.getItem(1).setRotate(computeDegrees(selection.angle), 0, 0);

    // render selection
    const dimension = selection.dimension/*for convenience*/;
    this.element.setAttribute('x', (-dimension.width / 2).toString());
    this.element.setAttribute('y', (-dimension.height / 2).toString());
    this.element.setAttribute('width', dimension.width.toString());
    this.element.setAttribute('height', dimension.height.toString());
    this.element.setAttribute('style', toCSSString(selection.style));

    this.rotator.update(selection.rotator);
    ResizerElement.updateResizerElements(selection.resizers, this.resizers);
  }
}

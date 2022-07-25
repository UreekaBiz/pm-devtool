import { createDefaultRectangleAttributes, RectangleAttributes } from 'common';

import { SVGNS } from '../../constant';
import { computeCenterDimensionFromRect, computeRectFromAttributes, Point, Rect } from '../../util/math';
import { AbstractShapePreview } from '../AbstractShapePreview';
import { getRectStyle } from './ui';

// ********************************************************************************
export class RectanglePreview implements AbstractShapePreview {
  // .. Attribute .................................................................
  private rect: Rect;
  private defaultAttributes: RectangleAttributes;
  public element: SVGGraphicsElement;

  // .. Setup .....................................................................
  constructor() {
    this.rect = { topLeft: { x: 0, y: 0 }, bottomRight: { x: 0,  y: 0 } };
    this.defaultAttributes = createDefaultRectangleAttributes();
    this.element = this.createElement();
  }

  // .. Lifecycle .................................................................
  public createElement(): SVGRectElement { return document.createElementNS(SVGNS, 'rect'); }

  public updateElement(startingPoint: Point, mousePosition: Point) {
    const { element } = this/*for convenience*/;

    let width = Math.floor(mousePosition.x - startingPoint.x),
        height = Math.floor(mousePosition.y - startingPoint.y);

    const x = (width > 0) ? startingPoint.x : mousePosition.x,
          y = (height > 0) ? startingPoint.y : mousePosition.y;
          width = (width !== 0) ? Math.abs(width) : 1/*minimum width*/,
          height = (height !== 0) ? Math.abs(height) : 1/*minimum height*/;

    this.rect = computeRectFromAttributes(x, y, width, height);

    element.setAttribute('x', x.toString());
    element.setAttribute('y', y.toString());
    element.setAttribute('width', width.toString());
    element.setAttribute('height', height.toString());
    element.setAttribute('style', getRectStyle(this.defaultAttributes));
  }

  public removeElement() { this.element.remove(); }

  // .. Attribute .................................................................
  public getNodeAttrsFromElement(): RectangleAttributes {
    const { center, dimension } = computeCenterDimensionFromRect(this.rect);

    const { defaultAttributes } = this;
          defaultAttributes.centerX = Math.floor(center.x);
          defaultAttributes.centerY = Math.floor(center.y);
          defaultAttributes.width = Math.floor(dimension.width);
          defaultAttributes.height = Math.floor(dimension.height);

    return defaultAttributes;
  }
}

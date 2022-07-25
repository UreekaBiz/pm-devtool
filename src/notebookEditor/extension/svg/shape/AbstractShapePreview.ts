import { NodeName, ShapeAttributes } from 'common';

import { Point } from '../util/math';
import { RectanglePreview } from './rectangle/RectangleShapePreview';

// ********************************************************************************
export abstract class AbstractShapePreview {
  // ==============================================================================
  // .. Attribute .................................................................
  public element: SVGGraphicsElement;

  // .. Setup .....................................................................
  public constructor() { this.element = this.createElement(); }

  public static getPreview(nodeName: NodeName) {
    switch(nodeName) {
      case NodeName.RECTANGLE:
        return new RectanglePreview();
    }

    throw new Error(`shapePreview not defined for ${nodeName}`);
  }

  // ==============================================================================
  // .. Lifecycle .................................................................
  public abstract createElement(): SVGGraphicsElement;
  public abstract updateElement(startingPoint: Point, mousePosition: Point): void;
  public abstract removeElement(): void;

  // .. Attribute .................................................................
  public abstract getNodeAttrsFromElement(): ShapeAttributes;
}

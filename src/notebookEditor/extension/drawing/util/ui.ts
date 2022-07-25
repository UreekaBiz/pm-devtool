import { Node as ProseMirrorNode } from 'prosemirror-model';

import { NodeIdentifier } from 'common';
import { INLINE_NODE_CONTAINER_CLASS } from 'constant';

import { SELECTION_G, SHAPE_G, SVGNS } from '../constant';
import { isResizerLocation, ResizerLocation } from '../shape/Resizer';
import { ShapeIdentifier } from '../type';
import { Point } from './math';

// ********************************************************************************
// == General =====================================================================
export const createInlineNodeContainer = (): HTMLSpanElement => {
  const inlineContainer = document.createElement('span');
        inlineContainer.setAttribute('contentEditable', 'false');
        inlineContainer.classList.add(INLINE_NODE_CONTAINER_CLASS);

  return inlineContainer;
};

export const createG = (node: ProseMirrorNode, type: typeof SHAPE_G | typeof SELECTION_G): SVGGElement => {
  const gElement = document.createElementNS(SVGNS, 'g');
        gElement.setAttribute('id', `${type}-${node.attrs.id}`);

  return gElement;
};

export const getMousePosition = (event: Event, drawingCanvas: SVGSVGElement): Point | undefined => {
  if(!isMouseEvent(event)) return;

  const CTM = drawingCanvas.getScreenCTM();
  if(!CTM) return;

  if(isTouchEvent(event)) {
    const touch = event.touches[0];
    return {
      x: (touch.clientX - CTM.e) / CTM.a,
      y: (touch.clientY - CTM.f) / CTM.d,
    };
  } /* else -- a mouse event by contract */

  return {
    x: (event.clientX - CTM.e) / CTM.a,
    y: (event.clientY - CTM.f) / CTM.d,
  };
};

export const preventDefaults = (event: Event) => {
  event.stopImmediatePropagation();
  event.stopPropagation();
  event.preventDefault();
};

// == ID ==========================================================================
export const nodeIDtoShapeID = (id: string): ShapeIdentifier => `sh:${id}`;
export const shapeIDtoNodeID = (id: string): NodeIdentifier => id.slice(3/*remove 'sh:'*/);
export const createShapeSelectionId = (id: ShapeIdentifier) => `${id}:select`;
export const createShapeResizerId = (id: ShapeIdentifier, location: ResizerLocation) => `${id}:${location}`;
export const createShapeRotatorId = (id: ShapeIdentifier) => `${id}:rotator`;

// parses any type of ShapeIdentifier and returns the root identifier
const SHAPE_ID_REGEX = /^(sh:[0-9a-zA-Z]+)(?::([^$]+))?$/;
export const parseShapeId = (id: ShapeIdentifier): ShapeIdentifier | undefined/*not a shape*/ => {
  const groups = id.match(SHAPE_ID_REGEX);
  if(!groups || (groups.length < 2)) return undefined/*not a valid shape id*/;
  return groups[1/*1st capture group*/];
};
export const parseShapeResizerId = (id: ShapeIdentifier) => {
  const groups = id.match(SHAPE_ID_REGEX);
  if(!groups || (groups.length < 3)) return undefined/*not a valid shape id and/or resizer*/;
  return isResizerLocation(groups[2/*2nd capture group*/])
            ? { shapeID: groups[1/*1st capture group*/], location: groups[2/*2nd capture group*/] as ResizerLocation/*by definition*/ }
            : undefined/*not a resizer*/;
};
export const parseShapeRotatorId = (id: ShapeIdentifier): ShapeIdentifier | undefined/*not a shape*/ => {
  const groups = id.match(SHAPE_ID_REGEX);
  if(!groups || (groups.length < 3)) return undefined/*not a valid shape id and/or rotator*/;
  return (groups[2/*2nd capture group*/] === 'rotator')
            ? groups[1/*1st capture group*/]
            : undefined/*not a resizer*/;
};

// == Type Guard ==================================================================
// -- ProseMirror -----------------------------------------------------------------
export const isGetPos = (object: any): object is (() => number) => typeof object !== 'boolean';

// -- UI --------------------------------------------------------------------------
export const isElement = (target: EventTarget): target is Element => 'getAttribute' in target;

// FIXME: do this better!!!
export const isSVGGraphicsElement = (target: EventTarget | Element): target is SVGGraphicsElement =>
  ((target as HTMLElement).tagName === 'g') ||
  ((target as HTMLElement).tagName === 'ellipse') ||
  ((target as HTMLElement).tagName === 'line') ||
  ((target as HTMLElement).tagName === 'rect') ||
  ((target as SVGGraphicsElement).getAttribute('d') !== undefined);

// -- Event -----------------------------------------------------------------------
export const isTouchEvent = (event: Event): event is TouchEvent => 'touches' in event;
export const isMouseEvent = (event: Event): event is MouseEvent => 'clientX' in event && 'clientY' in event;

import { Node as ProseMirrorNode } from 'prosemirror-model';

import { INLINE_NODE_CONTAINER_CLASS } from 'constant';

import { SELECTION_G, SHAPE_G, SVGNS } from './constant';
import { Point } from './util/math';

// ********************************************************************************
// == General =====================================================================
export const createInlineNodeContainer = (): HTMLSpanElement => {
  const inlineContainer = document.createElement('span');
        inlineContainer.classList.add(INLINE_NODE_CONTAINER_CLASS);
        inlineContainer.setAttribute('contentEditable', 'false');

  return inlineContainer;
};

// ================================================================================
export const createG = (node: ProseMirrorNode, type: typeof SHAPE_G | typeof SELECTION_G): SVGGElement => {
  const gElement = document.createElementNS(SVGNS, 'g');
        gElement.setAttribute('id', `${type}-${node.attrs.id}`);

  return gElement;
};

// ================================================================================
export const createRandomHex = () => '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

// == ID ==========================================================================
export const nodeIDFromShape = (shapeID: string) => shapeID.split('-')[1/*after the '-'*/];
export const nodeIDFromSelectionRect = (selectionRectID: string) => selectionRectID.split('-')[1/*after the '-'*/];

// == Mouse =======================================================================
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

// == Event =======================================================================
export const preventDefaults = (event: Event) => {
  event.stopImmediatePropagation();
  event.stopPropagation();
  event.preventDefault();
};

// == Type Guard ==================================================================
// -- Element ---------------------------------------------------------------------
// FIXME: do this better!!!
export const isSVGGraphicsElement = (target: EventTarget | Element): target is SVGGraphicsElement =>
  ((target as HTMLElement).tagName === 'g') ||
  ((target as HTMLElement).tagName === 'ellipse') ||
  ((target as HTMLElement).tagName === 'line') ||
  ((target as HTMLElement).tagName === 'rect') ||
  ((target as SVGGraphicsElement).getAttribute('d') !== undefined);

export const isHTMLelement = (element: any): element is HTMLElement => 'getAttribute' in element;

// -- Gesture Event ---------------------------------------------------------------
export const isTouchEvent = (event: Event): event is TouchEvent => 'touches' in event;
export const isMouseEvent = (event: Event): event is MouseEvent => 'clientX' in event && 'clientY' in event;

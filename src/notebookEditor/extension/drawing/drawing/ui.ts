import { Node as ProseMirrorNode } from 'prosemirror-model';

import { DrawingAttributes, DRAWING_CANVAS, DRAWING_CANVAS_CLASS } from 'common';

import { DRAWING_LAYER, SELECTION_LAYER, SVGNS } from '../constant';
import { createInlineNodeContainer } from '../util/ui';

// ********************************************************************************
export const createDrawingView = (node: ProseMirrorNode<any>) => {
  const inlineContainer = createInlineNodeContainer();

  const drawingCanvas = createDrawingCanvas(node);

  const drawingLayer = document.createElementNS(SVGNS, 'g');
        drawingLayer.setAttribute('id', `${DRAWING_LAYER}-${node.attrs.id}`);

  const selectionLayer = document.createElementNS(SVGNS, 'g');
        selectionLayer.setAttribute('id', `${SELECTION_LAYER}-${node.attrs.id}`);

  return { inlineContainer, drawingCanvas, drawingLayer, selectionLayer };
};

export const createDrawingCanvas = (node: ProseMirrorNode): SVGSVGElement => {
  const nodeAttrs = node.attrs as DrawingAttributes;

  const drawingCanvas = document.createElementNS(SVGNS, 'svg');
        drawingCanvas.setAttribute('id', `${DRAWING_CANVAS}-${nodeAttrs.id}`);
        drawingCanvas.setAttribute('viewBox', `0 0 ${nodeAttrs.width} ${nodeAttrs.height}`);
        drawingCanvas.setAttribute('width', nodeAttrs.width.toString());
        drawingCanvas.setAttribute('height', nodeAttrs.height.toString());
        drawingCanvas.setAttribute('preserveAspectRatio', nodeAttrs.preserveAspectRatio);
        drawingCanvas.classList.add(DRAWING_CANVAS_CLASS);

  return drawingCanvas;
};


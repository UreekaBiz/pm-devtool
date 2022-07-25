import { SVGNodeType } from 'common';

import { DRAWING_LAYER, SELECTION_LAYER, SVGNS, SVG_CANVAS, SVG_CANVAS_CLASS } from './constant';

// ********************************************************************************
export const createSVGView = (node: SVGNodeType) => {
  const svgCanvas = createSVGCanvas(node);

    const drawingLayer = document.createElementNS(SVGNS, 'g');
          drawingLayer.setAttribute('id', `${DRAWING_LAYER}-${node.attrs.id}`);
    svgCanvas.appendChild(drawingLayer);

    const selectionLayer = document.createElementNS(SVGNS, 'g');
          selectionLayer.setAttribute('id', `${SELECTION_LAYER}-${node.attrs.id}`);
    svgCanvas.appendChild(selectionLayer);

  return { svgCanvas, drawingLayer, selectionLayer };
};

const createSVGCanvas = (node: SVGNodeType): SVGSVGElement => {
  const { attrs } = node;
  const svgCanvas = document.createElementNS(SVGNS, 'svg');
        svgCanvas.classList.add(SVG_CANVAS_CLASS);
        svgCanvas.setAttribute('id', `${SVG_CANVAS}-${attrs.id}`);
        svgCanvas.setAttribute('viewBox', `0 0 ${attrs.width} ${attrs.height}`);
        svgCanvas.setAttribute('width', attrs.width.toString());
        svgCanvas.setAttribute('height', attrs.height.toString());
        svgCanvas.setAttribute('preserveAspectRatio', attrs.preserveAspectRatio);
  return svgCanvas;
};

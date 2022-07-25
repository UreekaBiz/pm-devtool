import { Node as ProseMirrorNode } from 'prosemirror-model';

import { NotebookSchemaType } from 'common';

import { SHAPE_SELECTION_PADDING, SVGNS } from './constant';
import { computeRectFromCenterDimension, Dimension, Point } from './util/math';

// ********************************************************************************
// == Selection ===================================================================
/**
 * Creates the {@link SVGRectElement} used to represent the selection
 * of a shape inside an SVGNode
 */
export const createSelectionRect = (node: ProseMirrorNode<NotebookSchemaType>): SVGRectElement => {
  const selectionRect = document.createElementNS(SVGNS, 'rect');
  updateSelectionRectAttributes(node, selectionRect, false/*default*/);
  return selectionRect;
};

/**
 * Updates the attributes of a {@link SVGRectElement} given the new attributes of
 * the rectangle {@link ProseMirrorNode} that it represents
 */
export const updateSelectionRectAttributes = (node: ProseMirrorNode<NotebookSchemaType>, selectionRect: SVGRectElement, isVisible: boolean) => {
  const { id, centerX, centerY } = node.attrs;
  let { width, height } = node.attrs;

  const { topLeft } = computeRectFromCenterDimension({ x: centerX, y: centerY }, { width, height });
  const { selectionTopLeft, selectionDimension } = computeSelection(topLeft, { width, height });

  const visibility = 'visible',
        fill = 'transparent',
        stroke = isVisible ? 'black' : 'transparent',
        strokeWidth = 2,
        strokeDashArray = 9;

  selectionRect.setAttribute('id', `selectionRect-${id}`);
  selectionRect.setAttribute('x', selectionTopLeft.x.toString());
  selectionRect.setAttribute('y', selectionTopLeft.y.toString());
  selectionRect.setAttribute('width', selectionDimension.width.toString());
  selectionRect.setAttribute('height', selectionDimension.height.toString());
  selectionRect.setAttribute('style', `visibility: ${visibility}; fill: ${fill}; stroke: ${stroke}; stroke-width: ${strokeWidth}; stroke-dasharray: ${strokeDashArray}; opacity: 1;`);
};

/**
 * Computes the coordinates of the topLeft corner and dimension
 * that will be used to display the selection {@link SVGRectElement} for
 * a shape inside an SVGNode
 */
export const computeSelection = (topLeft: Point, dimension: Dimension) => {
  const selectionTopLeft: Point = {
    x: topLeft.x - SHAPE_SELECTION_PADDING,
    y: topLeft.y - SHAPE_SELECTION_PADDING,
  };

  const selectionDimension: Dimension = {
    width: dimension.width + (2 * SHAPE_SELECTION_PADDING),
    height: dimension.height + (2 * SHAPE_SELECTION_PADDING),
  };

  return { selectionTopLeft, selectionDimension };
};

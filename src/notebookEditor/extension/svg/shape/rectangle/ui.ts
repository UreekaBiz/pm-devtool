import { Node as ProseMirrorNode } from 'prosemirror-model';

import { isRectangleAttributes, NotebookSchemaType, RectangleAttributes } from 'common';

import { SHAPE, SVGNS } from '../../constant';
import { computeRectFromCenterDimension } from '../../util/math';

// ********************************************************************************
export const createRectangle = (node: ProseMirrorNode<NotebookSchemaType>): SVGRectElement => {
const rectElement = document.createElementNS(SVGNS, 'rect');
  updateRectAttributes(node, rectElement);
  return rectElement;
};

export const updateRectAttributes = (node: ProseMirrorNode<NotebookSchemaType>, rectElement: SVGGraphicsElement) => {
  const { attrs } = node;
  if(!isRectangleAttributes(attrs)) throw new Error('Invalid attributes for rectangle');

  const { id, centerX, centerY, width, height } = attrs;

  const rect = computeRectFromCenterDimension({ x: centerX, y: centerY }, { width, height }),
        { x, y } = rect.topLeft;

  rectElement.setAttribute('id', `${SHAPE}-${id}`);
  rectElement.setAttribute('x', x.toString());
  rectElement.setAttribute('y', y.toString());
  rectElement.setAttribute('width', width.toString());
  rectElement.setAttribute('height', height.toString());
  rectElement.setAttribute('style', getRectStyle(attrs));
};

export const getRectStyle = (attrs: RectangleAttributes) => {
  const { fill, stroke, strokeWidth, opacity } = attrs;
  const visibility = 'visible',
        strokeDashArray = 0;

  return `visibility: ${visibility}; fill: ${fill}; stroke: ${stroke}; stroke-width: ${strokeWidth}; stroke-dasharray: ${strokeDashArray}; opacity: ${opacity};`;
};

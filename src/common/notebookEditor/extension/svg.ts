import { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { Point } from 'notebookEditor/extension/svg/util/math';
import { generateNodeId } from 'notebookEditor/extension/util/node';

import { noNodeSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { NodeIdentifier, NodeName } from '../node';
import { NotebookSchemaType } from '../schema';
import { RectangleAttributes } from './rectangle';

// ********************************************************************************
export const isSVGAttributes = (attrs: any): attrs is SVGAttributes => 'viewBox' in attrs;

// ================================================================================
// -- Attribute -------------------------------------------------------------------
export const SVG_ID = 'Default SVG ID'/*FIXME: Cannot import DEFAULT_NODE_ID from uniqueNodeId*/;
export const SVG_VIEWBOX = '0 0 500 500';
export const SVG_WIDTH = 500;
export const SVG_HEIGHT = 500;
export const SVG_ASPECT_RATIO = 'xMinYMin slice';

// NOTE: This values must have matching types the ones defined in the Extension.
const SVGNodeAttributeSpec = {
  [AttributeType.Id]: noNodeSpecAttributeDefaultValue<NodeIdentifier>(),
  [AttributeType.ViewBox]: noNodeSpecAttributeDefaultValue<string>(),
  [AttributeType.Width]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Height]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.PreserveAspectRatio]: noNodeSpecAttributeDefaultValue<string>(),
};
export type SVGAttributes = AttributesTypeFromNodeSpecAttributes<typeof SVGNodeAttributeSpec>;

// ................................................................................
export const createDefaultSVGAttributes = (): SVGAttributes =>
  ({
    id: generateNodeId()/*unique for each invocation*/,

    viewBox: SVG_VIEWBOX,
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    preserveAspectRatio: SVG_ASPECT_RATIO,
  });

// ================================================================================
// -- Node Spec -------------------------------------------------------------------
export const SVGNodeSpec: NodeSpec = {
  name: NodeName.SVG,
  content: `${NodeName.RECTANGLE}*`,
  atom: true/*view does not have directly editable content*/,
  inline: true,
  group: 'inline',
  selectable: true,
  draggable: false,
};

// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the attributes
export type SVGNodeType = ProseMirrorNode<NotebookSchemaType> & { attrs: SVGAttributes; };
export const isSVGNode = (node: ProseMirrorNode<NotebookSchemaType>): node is SVGNodeType => node.type.name === NodeName.SVG;

// ================================================================================
// -- Render Spec -----------------------------------------------------------------
export const SVGNodeRendererSpec: NodeRendererSpec<SVGAttributes> = {
  tag: 'div',
  attributes: {/*TODO: Add attributes*/},
};

// == Tool ========================================================================
export const SVG_WIDTH_TOOL = 'svgWidthTool';
export const SVG_HEIGHT_TOOL = 'svgHeightTool';

// == SVG Shape ===================================================================
export type ShapeAttributes = RectangleAttributes/*intended to have attrs for all shapes*/;

/**
 * Contains the information an {@link SVGNodeView} needs to keep track of for every
 * shape inside of it
 */
export type ContentEntry = {
  node: ProseMirrorNode<NotebookSchemaType>;

  shape: Shape;
  selection: ShapeSelection;
}

/**
 * Contains the graphic element and the center that is used to compute its properties
 * for the shape of a particular {@link ContentEntry} inside a {@link SVGNodeView}
 */
export type Shape = {
  shapeElement: SVGGraphicsElement;
  shapeCenter: Point;
}

/**
 * Contains the graphic elements for the shapeSelection of a particular {@link ContentEntry}
 * inside a {@link SVGNodeView}
 */
export type ShapeSelection = {
  selectionG: SVGGraphicsElement;
  selectionRect: SVGRectElement;
}

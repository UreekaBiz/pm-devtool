import { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model';

import { DrawingView } from 'notebookEditor/extension/drawing/drawing/DrawingView';
import { ShapeIdentifier } from 'notebookEditor/extension/drawing/type';

import { noNodeSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../attribute';
import { NodeRendererSpec } from '../htmlRenderer/type';
import { NodeIdentifier, NodeName } from '../node';
import { NotebookSchemaType } from '../schema';

// ********************************************************************************
export type DrawingStorage = { drawingViewMap: Map<ShapeIdentifier, DrawingView>; }

// -- Attribute -------------------------------------------------------------------
export const DRAWING_ID = 'Default Drawing ID';
export const DRAWING_VIEWBOX = '0 0 700 700';
export const DRAWING_WIDTH = 700;
export const DRAWING_HEIGHT = 700;
export const DRAWING_PRESERVE_ASPECT_RATIO = 'xMinYMin slice';

// NOTE: This values must have matching types the ones defined in the Extension.
const DrawingAttributeSpec = {
  [AttributeType.Id]: noNodeSpecAttributeDefaultValue<NodeIdentifier>(),
  [AttributeType.ViewBox]: noNodeSpecAttributeDefaultValue<string>(),
  [AttributeType.Width]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.Height]: noNodeSpecAttributeDefaultValue<number>(),
  [AttributeType.PreserveAspectRatio]: noNodeSpecAttributeDefaultValue<string>(),
};
export type DrawingAttributes = AttributesTypeFromNodeSpecAttributes<typeof DrawingAttributeSpec>;

// ================================================================================
// -- Node Spec -------------------------------------------------------------------
export const DrawingNodeSpec: NodeSpec = {
  name: NodeName.DRAWING,
  drawingRole: NodeName.DRAWING,
  content: `${NodeName.RECTANGLE}*`,
  atom: true,
  inline: true,
  group: 'inline',
  allowDropCursor: false,
  selectable: true,
  draggable: false,
  defining: true,
};

// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way to ensure the right attributes will be available
//       since PM does not provide a way to specify their type
export type DrawingNodeType = ProseMirrorNode<NotebookSchemaType> & { attrs: DrawingAttributes; };
export const isDrawingNode = (node: ProseMirrorNode<NotebookSchemaType>): node is DrawingNodeType => node.type.name === NodeName.DRAWING;

// ================================================================================
// -- Render Spec -----------------------------------------------------------------
export const DrawingNodeRendererSpec: NodeRendererSpec<DrawingAttributes> = {
  tag: 'div',
  attributes: {/*TODO: Add attributes*/},
};

// == Tool ========================================================================
export const SET_DRAWING_TOOL_BUTTON = 'setDrawingToolButton';

// == CSS =========================================================================
export const DRAWING_CANVAS = 'drawingCanvas';
export const DRAWING_CANVAS_CLASS = DRAWING_CANVAS/*semantic differentiation*/;

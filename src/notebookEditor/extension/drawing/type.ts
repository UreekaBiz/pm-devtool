import { DrawingView } from './drawing/DrawingView';
import { Shape, ShapeElement } from './shape/Shape';
import { ShapeSelection, ShapeSelectionElement } from './shape/ShapeSelection';

// ================================================================================
// == Shape =======================================================================
export type ShapeIdentifier = string/*alias*/;
export enum ShapeType {/*TODO: Add back*/
  // Ellipse = 'ellipse',
  // Line = 'line',
  Rectangle = 'rectangle',
}

// == Content =====================================================================
export type ContentEntry = {
  id: ShapeIdentifier;

  shape: Shape;
  selection: ShapeSelection;
};

export type ContentVisual = Readonly<{
  shape: ShapeElement;
  selection: ShapeSelectionElement;
}>;

// == Tool ========================================================================
// a tool responds to user gestures to affect the model which in turn updates the view.
// Some tools (e.g. CreateRectangleTool) are 1-shot. Read the corresponding class

// doc to know how to use a Tool.
export type Tool = {
  /** destroys the tool once it is no longer in use */
  destroy: () => void;
};
export type SubTool = Tool/*simply a marker interface for non-top-level Tools*/;

// --------------------------------------------------------------------------------
export type ToolDefinition = {
  id: string;
  cursor: string;
  createTool: (drawing: DrawingView) => Tool;
};

// == Event =======================================================================
// convenient way to hold a reference to an EventListener so it can be easily removed
export type EventListenerEntry = {
  type: string;
  listener: EventListener;
};

// == Style =======================================================================
export type ShapeStyle = {
  roughness: Roughness;

  stroke: string; // color of the stroke
  strokeWidth: number;
  strokeStyle: StrokeStyle; // NOTE: *not* RoughJS but 'strokeLineDash' must be computed

  fill: string; // color of the fill
  fillStyle: FillStyle;

  opacity: number; // NOTE: *not* RoughJS (passed through as CSS)
};

export type CSSStyle = {
  'visibility': string,
  'cursor'?: string,
  'opacity': string,

  'fill': string,
  'stroke': string,
  'stroke-width': string,
  'stroke-dasharray': string,
};

export type CircleStyle = CSSStyle/*alias*/;
export type Color = { name: string; hexCode: string; hslCode: string; key?: string; };

// == RoughJS =====================================================================
export type FillStyle = 'hachure' | 'cross-hatch' | 'solid';
export const isFillStyle = (fill: string): fill is FillStyle => fill === 'hachure' || fill === 'cross-hatch' || fill === 'solid';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted'/*NOTE: *not* RoughJS but 'strokeLineDash' must be computed*/;
export const isStrokeStyle = (style: string): style is StrokeStyle => style === 'solid' || style === 'dashed' || style === 'dotted';

export type Roughness = 0 | 1 | 2;
export const isRoughness = (roughness: number): roughness is Roughness => roughness === 0 || roughness === 1 || roughness === 2;

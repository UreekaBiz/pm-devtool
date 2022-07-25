import { SVGNodeView } from '../SVGNodeView';

// ********************************************************************************
// == Tool ========================================================================
// a tool responds to user gestures to affect the model which in turn updates the view.
// Some tools (e.g. CreateRectangleTool) are 1-shot. Read the corresponding class

// doc to know how to use a Tool.
export type Tool = {
  /** destroys the tool once it is no longer in use */
  destroy: () => void;
};
export type Subtool = Tool/*simply a marker interface for non-top-level Tools*/;

// --------------------------------------------------------------------------------
export type ToolDefinition = {
  cursor: string;
  createTool: (svg: SVGNodeView) => Tool;
};

// --------------------------------------------------------------------------------
export type EventListenerEntry = {
  type: string;
  listener: EventListener;
};

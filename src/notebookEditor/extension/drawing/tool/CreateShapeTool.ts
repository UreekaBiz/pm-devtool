import { generateNodeId } from 'notebookEditor/extension/util/node';

import { MOUSEDOWN, MOUSELEAVE, MOUSEMOVE, MOUSEUP } from '../constant';
import { DrawingView } from '../drawing/DrawingView';
import { ShapeFactory } from '../shape/ShapeFactory';
import { ContentEntry, ShapeType } from '../type';
import { computeBoxFromPoints, computeCenterDimensionFromPoints, Point } from '../util/math';
import { hexColorToColor } from '../util/style';
import { getMousePosition, preventDefaults } from '../util/ui';
import { AbstractTool } from './AbstractTool';

// a 1-shot handler for creating a new Shape. This is goes through a full
// life-cycle for each Shape that is to be created.
// NOTE: this can be made to be multi-shot if needed (i.e. there's no technical limitation)
// ********************************************************************************
// TODO: rename
export class CreateShapeTool extends AbstractTool {
  private shapeID = generateNodeId();

  private startingPoint: Point | undefined/*not created until mouse down*/;
  private contentEntry: ContentEntry | undefined/*shape not created until mouse moved*/;

  // == Life-cycle ================================================================
  /**
   * @param drawing the {@link DrawingView} to which the mouse listeners are attached
   * @see #destroy()
   */
  public constructor(drawing: DrawingView, private shapeType: ShapeType) {
    super(drawing);

    this.eventListenerEntries = [
      drawing.addEventListener(MOUSEDOWN,  event => this.mouseDown(event as MouseEvent)),
      drawing.addEventListener(MOUSEMOVE,  event => this.mouseMove(event as MouseEvent)),
      drawing.addEventListener(MOUSEUP,    event => this.mouseUp(event as MouseEvent)),
      drawing.addEventListener(MOUSELEAVE, event => this.mouseLeave(event as MouseEvent)),
    ];
  }

  public destroy() {
//console.log('CreateShapeTool', 'destroy');
    // TODO: the best answer is that the in-creation-shape is removed

    // NOTE: in lieu of the above TODO, this does the only thing sane which is to
    //       finish the in-creation process
    this.finishShapeCreation();

    // let the parent finish cleaning up
    super.destroy();
  }

  // == Listeners =================================================================
  private mouseDown(event: MouseEvent) {
    preventDefaults(event);

    if(this.startingPoint) { console.error(`Already started ${this.shapeType} creation (${this.shapeID}). Ignoring.`); return; }

    const mousePosition = getMousePosition(event, this.drawing.drawingCanvas);
    if(!mousePosition) return;

    this.drawing.removeAllSelections()/*by contract*/;

    // NOTE: don't create the shape until the mouse is moved (dragged) since a
    //       click does not result in a new shape (which would have a 0 size)
    this.startingPoint = mousePosition;
  }

  // ------------------------------------------------------------------------------
  private mouseMove(event: MouseEvent) {
    // CHECK: check for mouse button being held since this listener is called
    //        regardless if it's just a mouse move or a 'drag'
    if(!this.startingPoint) return/*no mouse down event*/;

    // it's possible that the mouse up occurred outside of this tools scope so only
    // continue the gesture if the mouse buttons are still down
    if(event.buttons === 0) {
      // TODO: see TODO on#destroy()
      this.finishShapeCreation();

      return/*nothing to do*/;
    } /* else -- the mouse is still down */

    const mousePosition = getMousePosition(event, this.drawing.drawingCanvas);
    if(!mousePosition) return;

    // create the shape if it hasn't already been created (has ContentEntry)
    if(!this.contentEntry) this.contentEntry = this.drawing.addContentEntry(this.shapeID, ShapeFactory.createModel(this.shapeID, this.shapeType, computeBoxFromPoints(this.startingPoint, mousePosition), 0/*initially not rotated*/));

    // NOTE: by contract the shape must be moved / resized and rendered as it is
    //       not guaranteed to do so on creation above
    const { center, dimension } = computeCenterDimensionFromPoints(this.startingPoint, mousePosition);
    this.drawing.resizeContent(this.contentEntry, center, dimension);
    this.drawing.renderContent(this.contentEntry, true, false/*no selection during creation*/);
  }

  // ------------------------------------------------------------------------------
  private mouseUp(event: MouseEvent) {
// console.log('CreateShapeTool', 'mouseUp');
    if(!this.startingPoint || !this.contentEntry) { console.error(`Didn't start ${this.shapeType} creation (${this.shapeID}) during mouse move. Ignoring.`); return; }

    const mousePosition = getMousePosition(event, this.drawing.drawingCanvas);
    if(!mousePosition) return;

    // NOTE: for sanity, this updates the shape to the final position / size
    const { center, dimension } = computeCenterDimensionFromPoints(this.startingPoint, mousePosition);
    this.drawing.resizeContent(this.contentEntry, center, dimension);
    this.drawing.renderContent(this.contentEntry, true, true);

    this.finishShapeCreation();
  }

  // ------------------------------------------------------------------------------
  private mouseLeave(event: MouseEvent) {
    // nothing special (keep creating!)
  }

  // == End Shape Creation ========================================================
  private finishShapeCreation() {
    // select after insertion by default
    // NOTE: this will automatically set the default tool (which isn't this tool)
    //       therefore #destroy() will be called
    if(this.contentEntry) {
      const { id, shape, selection } = this.contentEntry,
            { center, dimension, style  } = shape,
            { angle  } = selection,
            { width, height } = dimension,
            { fill, fillStyle, stroke, strokeStyle, strokeWidth, opacity, roughness } = style;

      this.drawing.editor.commands.insertRectangle({
        id,
        centerX: center.x,
        centerY: center.y,
        width,
        height,
        angle,
        fill: hexColorToColor(fill),
        fillStyle,
        stroke: hexColorToColor(stroke),
        strokeStyle,
        strokeWidth,
        opacity,
        roughness,
      });

      this.drawing.setDrawingSelection([this.contentEntry]);
    }
    // NOTE: the above call to DrawingView#setSelection() will cause this tool to
    //       be destroyed. Proceed with caution!
  }
}

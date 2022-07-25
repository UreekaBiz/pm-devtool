import { MOUSEMOVE } from '../../constant';
import { DrawingView } from '../../drawing/DrawingView';
import { isBottom, isLeft, isRight, isTop, Resizer } from '../../shape/Resizer';
import { ContentEntry, SubTool } from '../../type';
import { computeBoxCenter, computeCenterDimensionFromBox, computeOrientedBoxFromCenterDimension, rotateBox, rotatePoint, Dimension, Point } from '../../util/math';
import { getMousePosition } from '../../util/ui';
import { AbstractTool } from '../AbstractTool';

// ********************************************************************************
// a subtool (delegate) of SelectionTool. This tool is 1-shot. Once the mouse is
// released (mouse-up) then the parent tool will #destroy it.
export class ResizeTool extends AbstractTool implements SubTool {
  private readonly center: Point;
  private readonly dimension: Dimension;
  private readonly angle: number;

  // == Life-cycle ================================================================
  /**
   * A mouse down occurred in the {@link SelectionTool} on a Shape (or Shapes) and
   * the remainder of the gesture has been delegated to this class.
   *
   * @param startingPoint the initial point at which the mouse click occurred
   * @param contentEntry the {@link ContentEntry} which is to be resized
   * @param resizer the {@link Resizer} that is being interacted with
   * @see #destroy()
   */
  public constructor(svgEditor: DrawingView, private startingPoint: Point, private contentEntry: ContentEntry, private resizer: Resizer) {
    super(svgEditor);

    this.eventListenerEntries = [
      svgEditor.addEventListener(MOUSEMOVE, event => this.mouseMove(event as MouseEvent)),
    ];

    this.center = { ...this.contentEntry.shape.center }/*clone*/;
    this.dimension = { ...this.contentEntry.shape.dimension }/*clone*/;
    this.angle = this.contentEntry.shape.angle;
  }

  // ..............................................................................
  // theoretically this is called on mouseup. Since it's possible that the parent
  // SelectionTool removes this class' mouseup listener before it's called, this
  // was moved to #destroy() to ensure that it's guaranteed to be called
  public destroy() {
    this.drawing.updateEditorShape(this.contentEntry);

    // let the class parent do its cleanup
    super.destroy();
  }

  // == Listeners =================================================================
  private mouseMove(event: MouseEvent) {
    let mousePosition = getMousePosition(event, this.drawing.drawingCanvas);
    if(!mousePosition) return;

    const resizer = this.resizer/*for convenience*/;

    const startingPoint = this.startingPoint/*for convenience*/,
          angle = this.angle/*for convenience*/;
    const delta = { x: Math.floor(mousePosition.x - startingPoint.x), y: Math.floor(mousePosition.y - startingPoint.y) };

    // top-left and bottom-right are in shape space
    // NOTE: must be oriented so that an inverted shape does not also invert the resizers
    const box = computeOrientedBoxFromCenterDimension(this.center, this.dimension);

    // the gesture delta is in *screen* space and must be transformed to shape space
    // NOTE: since it's a delta, it's rotated about the origin
    const deltaShape = rotatePoint(delta, { x: 0, y: 0 }, -angle);

    // append the deltas and constrain the resize gesture based on which resizer is being used
    if(isLeft(resizer.location)) {
      box.x1 += deltaShape.x;
    } else if(isRight(resizer.location)) {
      box.x2 += deltaShape.x;
    } /* else -- not left or right */

    if(isTop(resizer.location)) {
      box.y1 += deltaShape.y;
    } else if(isBottom(resizer.location)) {
      box.y2 += deltaShape.y;
    } /* else -- not top or bottom */

    // compute top-left and bottom-right in shape space
    // CHECK: is the above comment backwards?
    // NOTE: 'T' suffix means 'transformed' (into shape space)
    const boxT = rotateBox(box, this.center, angle);

    // transform back into screen space
    const newCenterT = computeBoxCenter(boxT);
    const newBox = rotateBox(boxT, newCenterT, -angle);

    const { center, dimension } = computeCenterDimensionFromBox(newBox);
    this.drawing.resizeContent(this.contentEntry, center, dimension);
    this.drawing.renderContent(this.contentEntry, true, true);
  }
}

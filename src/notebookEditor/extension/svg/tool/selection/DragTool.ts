import { ContentEntry } from 'common';

import { MOUSEMOVE } from '../../constant';
import { SVGNodeView } from '../../SVGNodeView';
import { getMousePosition } from '../../util';
import { computePointDelta, computeTranslatedPoint, Point } from '../../util/math';
import { AbstractTool } from '../AbstractTool';
import { Subtool } from '../type';

// ********************************************************************************
// a subtool (delegate) of SelectionTool. This tool is 1-shot. Once the mouse is
// released (mouse-up) then the parent tool will #destroy it.
export class DragTool extends AbstractTool implements Subtool {
  private readonly startingPoint: Point;
  private readonly shapeCenter: Point;

  // == Life-cycle ================================================================
  /**
   * A mouse down occurred in the {@link SelectionTool} on a Shape (or Shapes) and
   * the remainder of the gesture has been delegated to this class.
   *
   * @param startingPoint the initial point at which the mouse click occurred
   * @param contentEntry the {@link ContentEntry} which is to be dragged
   * @see #destroy()
   */
  public constructor(svg: SVGNodeView, startingPoint: Point, private contentEntry: ContentEntry) {
    super(svg);

    this.eventListenerEntries = [
      svg.addEventListener(MOUSEMOVE, event => this.mouseMove(event as MouseEvent)),
    ];

    this.startingPoint = startingPoint;
    this.shapeCenter = { x: contentEntry.node.attrs.centerX, y: contentEntry.node.attrs.centerY };
  }

  // ..............................................................................
  // theoretically this is called on mouseup. Since it's possible that the parent
  // SelectionTool removes this class' mouseup listener before it's called, this
  // was moved to #destroy() to ensure that it's guaranteed to be called
  public destroy() {
    this.svg.updateEditorShape(this.contentEntry);

    // let the class parent do its cleanup
    super.destroy();
  }

  // == Listeners =================================================================
  private mouseMove(event: MouseEvent) {
    const mousePosition = getMousePosition(event, this.svg.svgCanvas);
    if(!mousePosition) return;

    this.svg.moveContent(this.contentEntry, computeTranslatedPoint(computePointDelta(this.startingPoint, mousePosition), this.shapeCenter));
    // this.svg.renderContent(this.contentEntry, true, true);
  }
}

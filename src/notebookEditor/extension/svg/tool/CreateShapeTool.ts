import { NodeName } from 'common';

import { MOUSEDOWN, MOUSELEAVE, MOUSEMOVE, MOUSEUP } from '../constant';
import { shapeCreatePlugin, shapeCreateKey } from '../plugin/shapeCreate';
import { AbstractShapePreview } from '../shape/AbstractShapePreview';
import { getMousePosition, preventDefaults } from '../util';
import { Point } from '../util/math';
import { SVGNodeView } from '../SVGNodeView';
import { AbstractTool } from './AbstractTool';

// ********************************************************************************
// a 1-shot handler for creating a new Shape. This is goes through a full
// life-cycle for each Shape that is to be created.
// NOTE: this can be made to be multi-shot if needed (i.e. there's no technical limitation)
export class CreateShapeTool extends AbstractTool {
  private startingPoint: Point | undefined/*not created until mouse down*/;
  private shapePreview: AbstractShapePreview | undefined/*shape not created until mouse moved*/;
  private shapeCreated: boolean;

  // == Life-cycle ================================================================
  /**
   * @param svg the {@link SVGNodeView} to which the mouse listeners are attached
   * @see #destroy()
   */
  public constructor(svg: SVGNodeView, private nodeName: NodeName) {
    super(svg);
    this.svg.editor.registerPlugin(shapeCreatePlugin());

    this.eventListenerEntries = [
      svg.addEventListener(MOUSEDOWN, event => this.mouseDown(event as MouseEvent)),
      svg.addEventListener(MOUSEMOVE, event => this.mouseMove(event as MouseEvent)),
      svg.addEventListener(MOUSEUP, () => this.mouseUp()),
      svg.addEventListener(MOUSELEAVE, event => this.mouseLeave(event as MouseEvent)),
    ];

    this.shapeCreated = false/*not created by default*/;
  }

  // ..............................................................................
  // theoretically this is called on mouseup. Since it's possible that the parent
  // SelectionTool removes this class' mouseup listener before it's called, this
  // was moved to #destroy() to ensure that it's guaranteed to be called
  public destroy() {
    // NOTE: since destroy and mouseUp can be both called, prevent a double creation
    if(!this.shapeCreated) this.finishShapeCreate();

    // let the parent finish cleaning up
    super.destroy();
  }

  // == Listeners =================================================================
  private mouseDown(event: MouseEvent) {
    if(this.startingPoint) { console.error(`Already started '${this.nodeName}' creation. Ignoring.`); return; }

    preventDefaults(event);
    const mousePosition = getMousePosition(event, this.svg.svgCanvas);
    if(!mousePosition) return;

    this.svg.setSelectionInsideSVG(0/*select the SVG*/);

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
      this.destroy();
      return/*nothing left to do*/;
    } /* else -- the mouse is still down */

    preventDefaults(event);
    const mousePosition = getMousePosition(event, this.svg.svgCanvas);
    if(!mousePosition) return;

    // create the shape if it hasn't already been created
    if(!this.shapePreview) {
      this.shapePreview = AbstractShapePreview.getPreview(this.nodeName);
      this.svg.drawingLayer.appendChild(this.shapePreview.element);
    } /* else -- shape already created */
    this.shapePreview.updateElement(this.startingPoint, mousePosition);
  }

  // ------------------------------------------------------------------------------
  private mouseUp() {
    // NOTE: see NOTE on #destroy()
    if(!this.shapeCreated) this.finishShapeCreate();
  }

  // ..............................................................................
  private finishShapeCreate() {
    if(!this.shapePreview) throw new Error('Shape Preview should exist by contract');

    const nodeAttrs = this.shapePreview.getNodeAttrsFromElement();
    this.shapePreview.removeElement();

    this.shapeCreated = true/*by definition*/;
    this.svg.persistShape(nodeAttrs, this.nodeName);

    this.svg.editor.unregisterPlugin(shapeCreateKey);
    this.destroy()/*ensure listeners get removed*/;
  }

  // ------------------------------------------------------------------------------
  private mouseLeave(event: MouseEvent) { preventDefaults(event); }
}

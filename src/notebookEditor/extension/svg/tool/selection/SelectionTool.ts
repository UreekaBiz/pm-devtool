import { getNodeOffset } from 'notebookEditor/extension/util/node';

import { MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSE_CURSOR_CLASS, MOUSE_MOVE_CURSOR_CLASS, SELECTION_RECT } from '../../constant';
import { nodeIDFromSelectionRect, getMousePosition, isSVGGraphicsElement, preventDefaults } from '../../util';
import { SVGNodeView } from '../../SVGNodeView';
import { Subtool } from '../type';
import { AbstractTool } from '../AbstractTool';
import { DragTool } from './DragTool';

// ********************************************************************************
// this tool is multi-shot
export class SelectionTool extends AbstractTool {
  // if there is a subtool then the mouse button is currently down
  private subtool: Subtool | undefined/*no subtool active*/ = undefined/*none active by default*/;

  // == Life-cycle ================================================================
  /**
   * @see #destroy()
   */
  public constructor(svg: SVGNodeView) {
    super(svg);

    this.eventListenerEntries = [
      svg.addEventListener(MOUSEDOWN,  (event) => this.mouseDown(event as MouseEvent)),
      svg.addEventListener(MOUSEMOVE,  (event) => this.mouseMove(event as MouseEvent)),
      svg.addEventListener(MOUSEUP,    (event) => this.mouseUp(event as MouseEvent)),
    ];
  }

  public destroy() {
    super.destroy();

    if(this.subtool) {
      this.subtool.destroy()/*by contract*/;
      this.subtool = undefined/*reset for sanity*/;
    } /* else -- no subtool */
  }

  // == Listeners =================================================================
  // -- Start Subtool Lifecycle ---------------------------------------------------
  private mouseDown(event: MouseEvent) {
    if(!event.target || !isSVGGraphicsElement(event.target)) return;
    const element = event.target,
          elementID = element.getAttribute('id');
    if(!elementID) return/*nothing to do*/;

    if(elementID === this.svg.node.attrs.id) {
      this.svg.setSelectionInsideSVG(0/*select the SVG*/);
      return/*svg selection handled by PM*/;
    }

    if(!elementID.includes(SELECTION_RECT)) return/*nothing to do*/;

    preventDefaults(event);
    const contentEntry = this.svg.contentEntryMap.get(nodeIDFromSelectionRect(elementID));
    if(!contentEntry) throw new Error('Node does not exist inside the contentEntryMap for the SVG');

    const clickedNodeOffset = getNodeOffset(this.svg.node, contentEntry.node);
    this.svg.setSelectionInsideSVG(clickedNodeOffset);

    // get the initial position (as all subtools require it)
    const mousePosition = getMousePosition(event, this.svg.svgCanvas);
    if(!mousePosition) return;

    // depending on what part of the shape that the mouse is over, set up the
    // appropriate sub-tool. If it was over a resizer then resize otherwise drag
    // TODO: Add back
    // const resizer = this.svg.getResizer(clickedElement, contentEntry),
    //       rotator = this.svg.getRotator(clickedElement);
    // if(resizer) this.subtool = new ResizeTool(this.svg, mousePosition, contentEntry, resizer);
    // else if(rotator) this.subtool = new RotateTool(this.svg, mousePosition, contentEntry)
    this.subtool = new DragTool(this.svg, mousePosition, contentEntry);
  }

  // ------------------------------------------------------------------------------
  private mouseMove(event: MouseEvent) {
    if(!event.target || !isSVGGraphicsElement(event.target) || !(event.target.parentElement)) return;
    const element = event.target,
          elementID = element.getAttribute('id');
    if(!elementID) return/*nothing to do*/;

    if(elementID === this.svg.node.attrs.id) this.svg.setCursor(MOUSE_CURSOR_CLASS);
    /* else -- hovering over a shape */

    // it's possible that the mouse up occurred outside of this tool's scope so
    // only continue the gesture if the mouse buttons are still down
    if(event.buttons === 0) {
      // there may still be a subtool so remove it
      this.removeSubtool();
    } /* else -- a button is still pressed */

    // set the cursor based on if the element is a Shape or not and if a sub-tool is currently in use
    if(elementID.includes(SELECTION_RECT) && !(this.subtool)) this.svg.setCursor(MOUSE_MOVE_CURSOR_CLASS);
  }

  // -- End Subtool Lifecycle -----------------------------------------------------
  private mouseUp(event: MouseEvent) {
    // the gesture is finished. Destroy any subtool by contract
    this.removeSubtool();
  }

  // ..............................................................................
  private removeSubtool() {
    if(this.subtool) {
      this.subtool.destroy()/*by contract*/;
      this.subtool = undefined/*reset for sanity*/;
    } /* else -- no subtool */
  }
}

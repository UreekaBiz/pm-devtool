import { findLastNodeByID } from 'notebookEditor/extension/util/node';

import { AbstractTool } from '../AbstractTool';
import { SubTool } from '../../type';
import { DrawingView } from '../../drawing/DrawingView';
import { MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSE_CURSOR_CLASS, MOUSE_MOVE_CURSOR_CLASS } from '../../constant';
import { getMousePosition, isSVGGraphicsElement, shapeIDtoNodeID } from '../../util/ui';
import { ResizeTool } from './ResizeTool';
import { RotateTool } from './RotateTool';
import { DragTool } from './DragTool';

// ********************************************************************************
// this tool is multi-shot
export class SelectionTool extends AbstractTool {
  // if there is a subtool then the mouse button is currently down
  private subtool: SubTool | undefined/*no subtool active*/ = undefined/*none active by default*/;

  // == Life-cycle ================================================================
  /**
   * @see #destroy()
   */
  public constructor(drawing: DrawingView) {
    super(drawing);

    this.eventListenerEntries = [
      drawing.addEventListener(MOUSEDOWN,  event => this.mouseDown(event as MouseEvent)),
      drawing.addEventListener(MOUSEMOVE,  event => this.mouseMove(event as MouseEvent)),
      drawing.addEventListener(MOUSEUP,    event => this.mouseUp(event as MouseEvent)),
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
  // -- Start SubTool Lifecycle ---------------------------------------------------
  private mouseDown(event: MouseEvent) {
    if(!event.target || !isSVGGraphicsElement(event.target)) return;
    const clickedElement = event.target;
    // get the content associated with the SVG element (if there is one)
    const contentEntry = this.drawing.getContentEntry(clickedElement);
//console.log('SelectionTool', 'mouseDown', contentEntry, event.target);
    if(!contentEntry) {
      this.drawing.removeAllSelections();
      this.drawing.editor.commands.setNodeSelection(this.drawing.getPos());
      return;
    } /* else -- there is a shape */

    // select the shape
    this.drawing.setDrawingSelection([ contentEntry ]);
    const selectedNodeObject = findLastNodeByID(this.drawing.node, shapeIDtoNodeID(contentEntry.id));
    if(!selectedNodeObject) throw new Error('Clicked on element whose node does not exist');
    this.drawing.editor.commands.setNodeSelection(this.drawing.getPos() + selectedNodeObject.position + 1/*account for 0 indexing*/);

    // get the initial position (as all subtools require it)
    const mousePosition = getMousePosition(event, this.drawing.drawingCanvas);
    if(!mousePosition) return;

    // depending on what part of the shape that the mouse is over, set up the
    // appropriate sub-tool. If it was over a resizer then resize otherwise drag
    const resizer = this.drawing.getResizer(clickedElement, contentEntry),
          rotator = this.drawing.getRotator(clickedElement);
    if(resizer) this.subtool = new ResizeTool(this.drawing, mousePosition, contentEntry, resizer);
    else if(rotator) this.subtool = new RotateTool(this.drawing, mousePosition, contentEntry);
    else this.subtool = new DragTool(this.drawing, mousePosition, contentEntry);
  }

  // ------------------------------------------------------------------------------
  private mouseMove(event: MouseEvent) {
    if(!event.target || !isSVGGraphicsElement(event.target) || !(event.target.parentElement)) return;
    const element = event.target;

    const contentEntry = this.drawing.getContentEntry(element);
// console.log('SelectionTool', 'mouseMove', contentEntry, event.target);

    // it's possible that the mouse up occurred outside of this tool's scope so
    // only continue the gesture if the mouse buttons are still down
    if(event.buttons === 0) {
      // there may still be a subtool so remove it
      this.removeSubtool();
    } /* else -- a button is still pressed */

    // set the cursor based on if the element is a Shape or not and if a sub-tool
    // is currently in use
    if(!this.subtool) this.drawing.setCursor(contentEntry ? MOUSE_MOVE_CURSOR_CLASS : MOUSE_CURSOR_CLASS);
  }

  // -- End SubTool Lifecycle -----------------------------------------------------
  private mouseUp(event: MouseEvent) {
// console.log('SelectionTool', 'mouseUp', this.subtool);
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

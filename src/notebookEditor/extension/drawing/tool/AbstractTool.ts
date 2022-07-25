import { DrawingView } from '../drawing/DrawingView';
import { EventListenerEntry, Tool } from '../type';

// ********************************************************************************
// convenience abstract class that provides the 'event listener' behavior common
// to (most) Tools
export abstract class AbstractTool implements Tool {
  protected eventListenerEntries: EventListenerEntry[] = [/*none by default*/];

  // == Life-cycle ================================================================
  /**
   * @param drawing the {@link DrawingView} to which the mouse listeners are attached
   * @see #destroy()
   */
  public constructor(protected drawing: DrawingView) { /*add listeners in subclass */ }

  /**
   * Removes any mouse listeners from the {@link DrawingView} that were added on construction
   */
  public destroy() {
    this.eventListenerEntries.forEach(entry => this.drawing.removeEventListener(entry));
    this.eventListenerEntries = []/*clear for sanity*/;
  }
}

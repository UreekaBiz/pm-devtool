import { SVGNodeView } from '../SVGNodeView';
import { EventListenerEntry, Tool } from './type';

// ********************************************************************************
// convenience abstract class that provides the 'event listener' behavior common
// to (most) Tools
export abstract class AbstractTool implements Tool {
  protected eventListenerEntries: EventListenerEntry[] = [/*none by default*/];

  // == Life-cycle ================================================================
  /**
   * @param svg the {@link SVGNodeView} to which the mouse listeners are attached
   * @see #destroy()
   */
  public constructor(protected svg: SVGNodeView) { /*add listeners in subclass */ }

  /** Removes any mouse listeners from the {@link SVGNodeView} that were added on construction */
  public destroy() {
    this.eventListenerEntries.forEach(entry => this.svg.removeEventListener(entry));
    this.eventListenerEntries = []/*clear for sanity*/;
  }
}

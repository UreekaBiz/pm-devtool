import { NodeViewStorage } from 'notebookEditor/model/NodeViewStorage';

import { SVGNodeView } from './SVGNodeView';

// storage exists for the life-time of the editor (specifically it exists regardless
// if any SVG or Shape nodes exist or have ever existed). Its primary function is
// to simplify operations that occur -across- SVG instances. For example, each time
// selection is changed then it must be possible to quickly determine if any SVG
// previously had been selected and then clear that selection.
// ********************************************************************************
export class SVGStorage extends NodeViewStorage<SVGNodeView> {
  // .. Selection .................................................................
  // the SVGNodeView that previously had the selection (if any)
  private selectedSVGNodeView: SVGNodeView | undefined = undefined/*none selected by default*/;

  // ==============================================================================

  // == Selection =================================================================
  // returns true if and only if the specified SVG is currently selected
  public isSelected(svgNodeView: SVGNodeView) { return (this.selectedSVGNodeView === svgNodeView); }

  // sets the specified SVG as the selected SVG
  public setSelection(svgNodeView: SVGNodeView) {
    if(this.isSelected(svgNodeView)) return/*already selected*/;
    if(this.selectedSVGNodeView) { /*something other than specified already selected*/
      this.selectedSVGNodeView.removeAllSelections();
    } /* else -- no current selection */

    this.selectedSVGNodeView = svgNodeView;
  }

  // selection has moved away from any SVG (including its child Shapes). Unselect
  // any currently selected SVG *except* the specified one
  public unselectAll(svgNodeView?: SVGNodeView) {
    if(!this.selectedSVGNodeView) return/*none selected so nothing to do*/;
    if(this.selectedSVGNodeView === svgNodeView) return/*don't unselect specified node view*/;

    this.selectedSVGNodeView.removeAllSelections();
    this.selectedSVGNodeView = undefined/*nothing is selected*/;
  }
}

import { Editor } from '@tiptap/core';
import { RoughGenerator } from 'roughjs/bin/generator';
import rough from 'roughjs/bin/rough';
import { RoughSVG } from 'roughjs/bin/svg';
import { NodeView } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';

import { computeRectStyle, NodeName, RectangleAttributes, DRAWING_CANVAS_CLASS } from 'common';

import { isNodeSelection } from 'notebookEditor/extension/util/node';

import { MOUSE_CURSOR_CLASS, ROUGHJS_SEED } from '../constant';
import { SelectionToolDefinition } from '../tool/tool';
import { ContentEntry, ContentVisual, EventListenerEntry, ShapeIdentifier, Tool, ToolDefinition } from '../type';
import { nodeIDtoShapeID, parseShapeId, parseShapeResizerId, parseShapeRotatorId, shapeIDtoNodeID } from '../util/ui';
import { createDrawingView } from './ui';
import { RectangleShape } from '../shape/rectangle/RectangleShape';
import { Shape } from '../shape/Shape';
import { ShapeSelection, ShapeSelectionElement } from '../shape/ShapeSelection';
import { ShapeFactory } from '../shape/ShapeFactory';
import { computeBoxFromCenterDimension, Dimension, Point } from '../util/math';

// ********************************************************************************
// == Class =======================================================================
export class DrawingView implements NodeView {
  // == Attribute =================================================================
  // -- ProseMirror  ------------------------------------------------------------
  public node: ProseMirrorNode;
  public editor: Editor;
  public readonly dom: HTMLSpanElement;
  public readonly getPos: (() => number);

  // -- Drawing -------------------------------------------------------------------
  public readonly drawingCanvas: SVGSVGElement;
  public readonly drawingLayer: SVGGElement;
  public readonly selectionLayer: SVGGElement;

  // map of ContentEntry ID to Content Entry (parallels #contentVisualMap)
  private readonly contentEntryMap = new Map<string/*id*/, ContentEntry>();

  // map from ContentEntry ID to ContentVisual (parallels #contentEntryMap)
  private readonly contentVisualMap = new Map<string/*id*/, ContentVisual>();

  private selectedContent: ContentEntry[] = []/*none selected by default*/;

  // .. Cursor ....................................................................
  private cursorClass: string/*TODO: tighten up!*/ = MOUSE_CURSOR_CLASS/*pointer by default*/;

  // -- Tool ----------------------------------------------------------------------
  // the currently active Tool and associated ToolDefinition
  // NOTE: these always match!
  private activeTool: Tool | undefined/*TODO: not undefined*/;
  private activeToolDefinition: ToolDefinition | undefined/*TODO: not undefined*/;

  // .. RoughJS ...................................................................
  public readonly roughSVG: RoughSVG;
  public readonly roughGenerator: RoughGenerator;

  // == Init ======================================================================
  constructor(node: ProseMirrorNode, editor: Editor, getPos: (() => number)) {
    // -- Setup -------------------------------------------------------------------
    // .. HTML ....................................................................
    const { inlineContainer, drawingCanvas, drawingLayer, selectionLayer } = createDrawingView(node);
    this.drawingCanvas = drawingCanvas;
    this.drawingLayer = drawingLayer;
    this.selectionLayer = selectionLayer;

    this.drawingCanvas.appendChild(this.drawingLayer);
    this.drawingCanvas.appendChild(this.selectionLayer);
    inlineContainer.appendChild(this.drawingCanvas);
    this.setDefaultTool();

    // .. RoughJS .................................................................
    this.roughSVG = rough.svg(this.drawingCanvas, { options: { seed: ROUGHJS_SEED } });
    this.roughGenerator = this.roughSVG.generator;

    // -- ProseMirror Ordering ----------------------------------------------------
    this.node = node;
    this.editor = editor;
    this.dom = inlineContainer;
    this.getPos = getPos;

    // -- Content -----------------------------------------------------------------
    this.drawContent();
    this.setInitialSelection();
  }

  // == ProseMirror  ==============================================================
  stopEvent(event: Event) { return true/*all selections are managed by this drawingView*/; }
  destroy() {
    if(!this.activeTool) return/*nothing to do*/;
    this.activeTool.destroy()/*remove listeners*/;
  }

  // == Content ===================================================================
  // -- Setup ---------------------------------------------------------------------
  private drawContent() {
    this.node.content.forEach(node => {
      if(node.type.name === NodeName.RECTANGLE) {
        const nodeAttrs = node.attrs as RectangleAttributes;
        const { id, centerX, centerY, width, height, angle } = nodeAttrs;
        const rectStyle = computeRectStyle(nodeAttrs);

        const rectBox = computeBoxFromCenterDimension({ x: centerX, y: centerY }, { width, height });
        this.addContentEntry(nodeIDtoShapeID(id), new RectangleShape(nodeIDtoShapeID(id), rectStyle, rectBox, angle));
      }
      /* else -- currently nothing */
    });
  }

  setInitialSelection() {
    const { selection } = this.editor.state;
    if(!isNodeSelection(selection) || !(selection.node.type.name === NodeName.RECTANGLE)) return/*nothing to do*/;

    const rectID = selection.node.attrs.id,
          shapeRectID = nodeIDtoShapeID(rectID);

    const contentEntry = this.getContentEntryById(shapeRectID);
    if(!contentEntry) throw new Error('Selected rectangle contentEntry does not exist by the time it should');
    /* else -- select it */

    this.removeAllSelections();
    this.setDrawingSelection([contentEntry]);
  }

  // -- Get -----------------------------------------------------------------------
  public getContentEntryById(id?: string): ContentEntry | undefined/*unknown id or doesn't represent ContentEntry*/ {
    if(!id) return undefined/*if nothing specified then no content (for convenience)*/;
    return this.contentEntryMap.get(id);
  }

  // ..............................................................................
  // get the content associated with the HTML element (if there is one)
  public getContentEntry(element: Element) {
    const shapeID = parseShapeId(element.id);
    return this.getContentEntryById(shapeID);
  }

  // get the resizer associated with the SVG element (if there is one)
  public getResizer(element: Element, contentEntry: ContentEntry) {
    const value = parseShapeResizerId(element.id);
    if(!value) return undefined/*no shape (or resizer)*/;
    return contentEntry.selection.resizers[value.location];
  }

  // get the rotator associated with the SVG element (if there is one)
  public getRotator(element: Element) {
    const shapeID = parseShapeRotatorId(element.id);
    if(!shapeID) return undefined/*no shape (or rotator)*/;
    return shapeID;
  }

  // -- Add -----------------------------------------------------------------------
  public addContentEntry(shapeID: ShapeIdentifier, shape: Shape): ContentEntry {
    // create model and add to map by contract (before the view just in case the view
    // would ever try to do a lookup)
    const contentEntry: ContentEntry = {
      id: shapeID,

      shape,
      selection: new ShapeSelection(shape.center, shape.dimension, shape.angle),
    };
    this.contentEntryMap.set(shapeID, contentEntry);

    // create view and add to map by contract
    const shapeElement = ShapeFactory.createElement(this, shape.type, shapeID, contentEntry.shape);
    this.drawingLayer.appendChild(shapeElement.element);

    const selectionVisual = new ShapeSelectionElement(this.drawingCanvas, shapeID, contentEntry.selection);
    this.selectionLayer.appendChild(selectionVisual.selectionG);

    const contentVisual: ContentVisual = { shape: shapeElement, selection: selectionVisual };
    this.contentVisualMap.set(shapeID, contentVisual);

    return contentEntry;
  }

  // -- Move / Resize / Rotate ----------------------------------------------------
  // updates model
  public moveContent(contentEntry: ContentEntry, centerPosition: Point) {
    contentEntry.shape.move(centerPosition);
    contentEntry.selection.move(centerPosition);
  }

  public resizeContent(contentEntry: ContentEntry, center: Point, dimension: Dimension) {
    contentEntry.shape.resize(center, dimension);
    contentEntry.selection.resize(center, dimension);
  }

  public rotateContent(contentEntry: ContentEntry, angle: number) {
    // NOTE: the shape and selection are always kept in sync
    contentEntry.shape.rotate(angle);
    contentEntry.selection.rotate(angle);
  }

  // -- Render --------------------------------------------------------------------
  // updates view
  public renderContent(contentEntry: ContentEntry, shouldRenderShape: boolean, shouldRenderSelection: boolean) {
    const visual = this.contentVisualMap.get(contentEntry.id);
    if(!visual) { console.error(`Not visual for content '${contentEntry.id}'`); return/*nothing to render!*/; }

    if(shouldRenderShape) {
      const shape = contentEntry.shape/*for convenience*/,
            shapeElement = visual.shape/*for convenience*/;

      // RoughJS (possibly) creates a new shape for each resize so the old element
      // must be removed and replaced with the new one
      this.drawingLayer.removeChild(shapeElement.element);
        shapeElement.update(shape, contentEntry.id);
      this.drawingLayer.appendChild(shapeElement.element);
    } /* else -- don't render shape */

    if(shouldRenderSelection) {
      const selection = contentEntry.selection/*for convenience*/,
            selectionVisual = visual.selection/*for convenience*/;

      selectionVisual.update(selection);
    } /* else -- don't render selection */
  }

  public updateEditorShape(contentEntry: ContentEntry) {
    const { id } = contentEntry;
    const { shape, selection } = contentEntry;
    const { x: centerX, y: centerY } = shape.center;
    const { width, height } = shape.dimension;
    const { angle } = selection;

    const prevPos = this.editor.state.selection.$anchor.pos;
    this.editor.chain().focus().updateShapeAttributes({ id: shapeIDtoNodeID(id), centerX, centerY, width, height, angle }).run();
    this.editor.chain().focus().setNodeSelection(prevPos).run();
  }

  // == Selection =================================================================
  // -- Update --------------------------------------------------------------------
  // NOTE: this is a PoC. The goal is to not expose the selection but to allow
  //       operations to be performed on it. This is specific to style (though in
  //       theory, anything in the ContentEntry could be updated by the updater)
  //       so that this knows that if anything was updated then it should rerender
  //       the shape so that the styles are reflected in the visuals
  public updateSelectedContentStyle(updater: (contentEntry: ContentEntry) => boolean | void/*default true*/) {
    this.selectedContent.forEach(content => {
      const updated = updater(content);
      if(updated !== false) this.renderContent(content, true/*update style by definition*/, false);
    });
  }

  // -- Set / Clear ---------------------------------------------------------------
  // clears the current selection and sets it to the specified selection. The default
  // tool is automatically set to the SelectionTool.
  public setDrawingSelection(selectedContent: ContentEntry[]) {
    this.removeAllSelections();

    this.selectedContent.push(...selectedContent);
    selectedContent.forEach(contentEntry => {
      contentEntry.selection.setVisible(true/*visible*/);
      this.renderContent(contentEntry, false, true);
    });

    // force the active Tool to be the SelectionTool by contract
    this.setActiveTool(SelectionToolDefinition);
  }

  public removeAllSelections() {
    // make only those elements that were previously selected, no longer selected
    // NOTE: this is a performance optimization (i.e. iterating over *all* elements
    //       is expensive)
    this.selectedContent.forEach(contentEntry => {
      contentEntry.selection.setVisible(false/*hide*/);
      this.renderContent(contentEntry, false, true);
    });

    this.selectedContent = []/*clear*/;
  }

  // == Cursor ====================================================================
  public setCursor(cursorClass: string) {
    if(this.cursorClass === cursorClass) return/*cursor class already set*/;
    this.cursorClass = cursorClass;

    this.drawingCanvas.removeAttribute('class')/*remove any other classes*/;
    this.drawingCanvas.classList.add(DRAWING_CANVAS_CLASS, cursorClass);
  }

  // == Tool ======================================================================
  public setActiveTool(toolDefinition: ToolDefinition) {
    // if the specified ToolDefinition matches the active one then there's nothing to do
    // NOTE: this ensures that selections don't swap out the selection tool (which
    //       must already be active by definition), etc.
    if(this.activeToolDefinition === toolDefinition) return/*nothing to do*/;
    this.activeToolDefinition = toolDefinition/*maintain state*/;

    // if there's already an active Tool then destroy it by contract
    if(this.activeTool) this.activeTool.destroy();

    this.setCursor(toolDefinition.cursor);
    // TODO: this is the only place where Toolbar is used in this class. Rethink if
    //       this is right!
    this.activeTool = toolDefinition.createTool(this);
  }

  public setDefaultTool() { this.setActiveTool(SelectionToolDefinition); }

  // == Event Listeners ===========================================================
  public addEventListener(type: string, listener: EventListener): EventListenerEntry {
    this.drawingCanvas.addEventListener(type, listener);
    return { type, listener }/*for convenience*/;
  }

  public removeEventListener({ type, listener }: EventListenerEntry) {
    this.drawingCanvas.removeEventListener(type, listener);
  }

  // == DOM =======================================================================
  // CHECK: where to best locate these?
  public createSVGTransform() { return this.drawingCanvas.createSVGTransform(); }
  public getScreenCTM() { return this.drawingCanvas.getScreenCTM(); }
}

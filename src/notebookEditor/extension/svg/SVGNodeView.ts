import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';

import { isRectangleAttributes, ContentEntry, NotebookSchemaType, NodeIdentifier, NodeName, SVGNodeType, ShapeSelection, Shape } from 'common';

import { getPosType, isNodeSelection } from 'notebookEditor/extension/util/node';
import { AbstractNodeView } from 'notebookEditor/model/AbstractNodeView';
import { SELECTED_CLASS } from 'notebookEditor/theme/theme';

import { createInlineNodeContainer } from '../util/ui';
import { MOUSE_CURSOR_CLASS, SVGNS, SVG_CANVAS_CLASS } from './constant';
import { computeSelection, createSelectionRect, updateSelectionRectAttributes } from './selection';
import { createRectangle, updateRectAttributes } from './shape/rectangle/ui';
import { selectionToolDefinition } from './tool/tool';
import { EventListenerEntry, Tool, ToolDefinition } from './tool/type';
import { createSVGView } from './ui';
import { computeRectFromCenterDimension, Point } from './util/math';
import { createG, isHTMLelement, nodeIDFromShape } from './util';
import { SVGStorage } from './SVGStorage';

// ********************************************************************************
// FIXME: Use model, controller, view paradigm

// == Class =======================================================================
export class SVGNodeView extends AbstractNodeView<SVGNodeType, SVGStorage> {
  // .. Model .....................................................................
  public readonly contentEntryMap = new Map<NodeIdentifier, ContentEntry>();

  // .. Tool ......................................................................
  public activeTool: Tool;
  public activeToolDefinition: ToolDefinition;

  // .. UI ........................................................................
  public readonly svgCanvas: SVGSVGElement;
  public readonly drawingLayer: SVGGElement;
  public readonly selectionLayer: SVGGElement;

  public cursorClass: string;

  // == Init ======================================================================
  public constructor(editor: Editor, node: SVGNodeType, svgStorage: SVGStorage, getPos: getPosType) {
    super(editor, node, svgStorage, getPos);

    // .. UI ......................................................................
    const { svgCanvas, drawingLayer, selectionLayer } = createSVGView(node);
    this.svgCanvas = svgCanvas;
    this.drawingLayer = drawingLayer;
    this.selectionLayer = selectionLayer;
    this.cursorClass = MOUSE_CURSOR_CLASS/*default*/;

    // .. Tool ....................................................................
    this.activeToolDefinition = selectionToolDefinition/*default*/;
    this.activeTool = this.activeToolDefinition.createTool(this);

    // .. Initial Render ..........................................................
    this.dom.appendChild(svgCanvas);
    this.updateView();
  }

  // == ProseMirror Methods =======================================================
  // -- Lifecycle -----------------------------------------------------------------
  // .. Update ....................................................................
  public update(node: ProseMirrorNode<NotebookSchemaType>) {
    if(!super.update(node)) return false/*nothing was updated*/;

    this.updateView();

    // if a shape was deleted then recreate the view
    const children = this.drawingLayer.childNodes;
    if(children.length !== this.node.childCount) {
      this.recreateView();
      return true;
    } /* else -- no shape was deleted, can check to see if order changed */

    // if the order of shapes is different then recreate the view
    let differentNodeOrder = false;
    this.node.descendants((node, nodeIndex) => {
      const shapeElement = children.item(nodeIndex);
      if(!isHTMLelement(shapeElement)) throw new Error('Shape in drawing layer is not a valid HTMLElement');

      const shapeElementID = shapeElement.getAttribute('id');
      if(!shapeElementID) throw new Error('Shape in drawing layer has no ID when it should by contract');

      if(!(nodeIDFromShape(shapeElementID) === node.attrs.id)) differentNodeOrder = true;
    });
    if(differentNodeOrder) { this.recreateView(); }
    /* else -- same order, can re-use view */

    // NOTE: since the above code block ensures that the view gets updated (on the
    //       updateView() call) regardless of whether or not the view was recreated,
    //       true is returned to indicate to PM that the view update was manually
    //       handled correctly
    return true/*updated*/;
  }

  // == Abstract Methods ==========================================================
  protected createDomElement() {
    return createInlineNodeContainer();
  }

  // == Custom Methods ============================================================
  // -- Content -------------------------------------------------------------------
  // .. Creation ..................................................................
  private createContentEntry(node: ProseMirrorNode<NotebookSchemaType>) {
    const shape = this.createShape(node),
          selection = this.createShapeSelection(node);
    this.contentEntryMap.set(node.attrs.id, { node, shape, selection });

    const setEntry = this.contentEntryMap.get(node.attrs.id);
    if(!setEntry) throw new Error(`Something went wrong setting the content entry for the SVG: ${this.node.attrs.id}`);

    this.drawingLayer.appendChild(setEntry.shape.shapeElement);
    this.selectionLayer.appendChild(setEntry.selection.selectionG);
  }

  private createShape(node: ProseMirrorNode<NotebookSchemaType>): Shape {
    if(node.type.name === NodeName.RECTANGLE) {
      return {
        shapeElement: createRectangle(node),
        shapeCenter: { x: node.attrs.centerX, y: node.attrs.centerY },
      };
    } /* else -- not a known shape */

    const element = document.createElementNS(SVGNS, 'rect');
    return { shapeElement: element, shapeCenter: { x: 0, y: 0 } };
  }

  private createShapeSelection(node: ProseMirrorNode<NotebookSchemaType>): ShapeSelection {
    const selectionRect = createSelectionRect(node);

    const selectionG = createG(node, 'selectionG');
          selectionG.appendChild(selectionRect);

    return { selectionG, selectionRect };
  }

  // Recreates shapes and selections to display them in the order
  // order of the svg node's content
  public recreateView() {
    this.contentEntryMap.forEach(entry => {
      entry.selection.selectionG.remove();
      entry.shape.shapeElement.remove();
    });
    this.contentEntryMap.clear();
    this.updateView();
  }

  // .. Move  .....................................................................
  // NOTE: Modifies the DOM elements visually before changes are eventually
  //       persisted to the editor
  public moveContent(entry: ContentEntry, newCenter: Point) {
    // update Model
    entry.shape.shapeCenter = newCenter;

    // update View
    const { width, height } = entry.node.attrs;

    const { topLeft } = computeRectFromCenterDimension(newCenter, { width, height });
    const { selectionTopLeft, selectionDimension } = computeSelection(topLeft, { width, height });

    const { shape, selection } = entry;
          shape.shapeElement.setAttribute('x', topLeft.x.toString());
          shape.shapeElement.setAttribute('y', topLeft.y.toString());
          selection.selectionRect.setAttribute('x', selectionTopLeft.x.toString());
          selection.selectionRect.setAttribute('y', selectionTopLeft.y.toString());
          selection.selectionRect.setAttribute('width', selectionDimension.width.toString());
          selection.selectionRect.setAttribute('height', selectionDimension.height.toString());
  }

  // .. Update ....................................................................
  protected updateView() {
    // .. Update SVG ..............................................................
    this.updateSVGCanvas();

    // .. Update Content ..........................................................
    this.node.descendants(node => {
      // add if non existent
      const contentEntry = this.contentEntryMap.get(node.attrs.id);
      if(!contentEntry) { this.createContentEntry(node); return /*nothing left to do*/; }
      /* else -- entry exists, update */

      // update content entry
      contentEntry.node = node;

      // update shape
      this.updateShape(contentEntry.node, contentEntry.shape);

      // Update selection
      this.updateShapeSelection(contentEntry.node, contentEntry.selection, false/*default*/);
    });
  }

  private updateSVGCanvas() {
    Object.keys(this.node.attrs).forEach(key => {
      const currentAttr = this.svgCanvas.getAttribute(key);
      if(!currentAttr) throw new Error(`Attr undefined when it should not by contract: ${currentAttr}`);
      if(currentAttr === this.node.attrs[key]) return/*same attribute, do not modify*/;

      this.svgCanvas.setAttribute(key, this.node.attrs[key]);
    });
  }

  private updateShape(node: ProseMirrorNode<NotebookSchemaType>, shape: Shape) {
    if(node.type.name === NodeName.RECTANGLE) return updateRectAttributes(node, shape.shapeElement);
    /* else -- do nothing */
  }

  private updateShapeSelection(node: ProseMirrorNode<NotebookSchemaType>, selection: ShapeSelection, isVisible: boolean) {
    updateSelectionRectAttributes(node, selection.selectionRect, isVisible);
  }

  // == Selection =================================================================
  // NOTE: All selection methods grouped together for sanity (SEE: SVG.ts, onSelectionUpdate)
  // -- ProseMirror ---------------------------------------------------------------
  // Triggered when the selected node is inside the SVGNode
  // NOTE: This method is needed so that ProseMirror correctly handles CMD-X and
  //       CMD-C, CMD-V events, since otherwise the selection is not considered to
  //       be inside the NodeView. Removing it causes these commands to stop
  //       working whenever a Shape is selected
  public setSelection(anchor: number, head: number) {
    const { selection } = this.editor.state;
    if(!isNodeSelection(selection)) throw new Error(`selection is not a NodeSelection when it should be: ${JSON.stringify(selection)}`);

    const { node } = selection,
          selectedShapeEntry = this.contentEntryMap.get(node.attrs.id);
    if(!selectedShapeEntry) throw new Error(`selectedShapeEntry is not in the contentEntryMap when it should be definition: ${JSON.stringify(node)}`);

    this.selectContentEntry(selectedShapeEntry);
    return /*nothing left to do*/;
  }

  // -- UI ------------------------------------------------------------------------
  public selectContentEntry(entry: ContentEntry) {
    // by default when a Shape is selected within the SVG, the SVG is also selected
    this.selectSVGNode();
    updateSelectionRectAttributes(entry.node, entry.selection.selectionRect, true/*visible*/);
  }

  public selectSVGNode() {
    this.deselectShapes();
    this.svgCanvas.classList.add(SELECTED_CLASS);

    this.storage.setSelection(this);
  }

  public removeAllSelections() {
    this.deselectShapes();
    this.svgCanvas.classList.remove(SELECTED_CLASS);
  }

  private deselectShapes() {
    this.contentEntryMap.forEach(entry => this.updateShapeSelection(entry.node, entry.selection, false));
  }

  // .. Selection Persistence .....................................................
  public setSelectionInsideSVG(offset: number) {
    this.storage.setSelection(this)/*for sanity even if set by selectionUpdate*/;
    this.editor.commands.setNodeSelection(this.getPos() + offset);
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
    this.activeTool = toolDefinition.createTool(this);
  }

  // == Event =====================================================================
  public addEventListener(type: string, listener: EventListener): EventListenerEntry {
    this.svgCanvas.addEventListener(type, listener);
    return { type, listener }/*for convenience*/;
  }

  public removeEventListener({ type, listener }: EventListenerEntry) {
    this.svgCanvas.removeEventListener(type, listener);
  }

  // == UI ========================================================================
  public setCursor(cursorClass: string) {
    if(this.cursorClass === cursorClass) return/*cursor class already set*/;
    this.cursorClass = cursorClass;

    this.svgCanvas.removeAttribute('class')/*remove any other classes*/;
    this.svgCanvas.classList.add(SVG_CANVAS_CLASS, cursorClass);

    // FIXME: rethink -- this occurs in the case where the toolbar is clicked. It
    //        should be handled at a different level. This is a hack.
    if(this.storage.isSelected(this)) this.svgCanvas.classList.add(SELECTED_CLASS);
  }

  // == Document Persistence ======================================================
  // .. Shape .....................................................................
  public updateEditorShape(entry: ContentEntry) {
    // .. Update PM Model  ........................................................
    const { id } = entry.node.attrs;
    const { shape } = entry;

    let { x: centerX, y: centerY } = shape.shapeCenter;
        centerX = Math.floor(centerX);
        centerY = Math.floor(centerY);

    const prevPos = this.editor.state.selection.$anchor.pos;
    this.editor.chain().focus().updateShapeAttributes({ id, centerX, centerY }).setNodeSelection(prevPos).run();

    // .. Update View Model  ......................................................
    const { selection } = this.editor.state;
    if(!isNodeSelection(selection)) throw new Error('Selection is not a NodeSelection when it should');

    const selectedShape = selection.node;
    entry.node = selectedShape;

    // .. Update View  ............................................................
    this.updateShape(entry.node, entry.shape);
    this.updateShapeSelection(entry.node, entry.selection, true);
  }

  public persistShape(nodeAttrs: { [key: string]: any; }, nodeName: NodeName) {
    if(nodeName === NodeName.RECTANGLE) {
      if(!isRectangleAttributes(nodeAttrs)) throw new Error('Received wrong kind of attributes for rectangle persistShape');
      this.editor.commands.insertRectangle(nodeAttrs);
      this.setActiveTool(selectionToolDefinition);
      return/*nothing left to do*/;
    } /* else -- shape not defined */

    throw new Error(`persistShape not defined for given nodeName: ${nodeName}`);
  }
}

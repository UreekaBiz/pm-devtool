import { CommandProps, Editor } from '@tiptap/core';
import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';

import { createDefaultRectangleAttributes, createDefaultSVGAttributes, isRectangleAttributes, isSVGNode, isSVGAttributes, NotebookSchemaType, NodeContent, NodeName, RectangleAttributes, SVGNodeType, SVG_WIDTH, SVG_HEIGHT } from 'common';

import { ToolDefinition } from './tool/type';
import { Dimension } from './util/math';
import { SVGNodeView } from './SVGNodeView';
import { SVGStorage } from './SVGStorage';
import { replaceAndSelectNode, getNodeOffset, getResolvedParentSelectionByAnchorOffset, createFragmentWithAppendedContent, getResolvedAnchorPos, isNodeSelection } from '../util/node';
import { shapeCreateKey } from './plugin/shapeCreate';
import { createRectangleNode } from './shape/rectangle/Rectangle';
import { createSVGNode } from './SVGNode';

// ********************************************************************************
// == Type ========================================================================
// NOTE: Usage of ambient module to ensure command is TypeScript-registered
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [NodeName.SVG/*Expected and guaranteed to be unique. (SEE: /notebookEditor/model/node)*/]: {
      // -- SVG -------------------------------------------------------------------
      /** Insert an SVGNode and select it */
      insertSVG: () => ReturnType;

      /** Update the {@link Dimension} of an SVGNode */
      updateSVGDimension: (dimension: Dimension) => ReturnType;

      /** Set the currently active tool for the active SVGView */
      setSVGTool: (toolDefinition: ToolDefinition) => ReturnType;

      // -- Shape -----------------------------------------------------------------
      /** Update the attributes of a particular shape; by ID */
      updateShapeAttributes: (attrs: Partial<RectangleAttributes>) => ReturnType;

      /** Change the order of a shape in the content of the SVG that holds it */
      updateShapeOrder: (indexChange: IndexChange, shapeAttrsCallback: (attrs: any) => boolean) => ReturnType;

      // -- Rectangle -------------------------------------------------------------
      /** Insert a Rectangle and select it */
      insertRectangle: (attributes?: RectangleAttributes) => ReturnType;
    };
  }
}

// == Implementation ==============================================================
// == SVG =========================================================================
/**
 * Creates and selects an {@ link SVGNode} by replacing whatever is at the current
 * selection with the newly created {@link SVGNode}.
 */
 export const insertAndSelectSVGNode = (props: CommandProps, content: NodeContent | undefined): boolean => {
   const svg = createSVGNode(props.editor.schema, createDefaultSVGAttributes(), content ? Fragment.fromJSON(props.editor.state.schema, JSON.parse(content)) : undefined);
   return replaceAndSelectNode(svg, props.tr, props.dispatch);
  };

// .. Update ......................................................................
export const updateSVGDimension = (commandProps: CommandProps, dimension: Dimension) => {
  const { width, height } = dimension;
  const clampedWidth = Math.max(0, Math.min(Number(width), SVG_WIDTH)),
        clampedHeight = Math.max(0, Math.min(Number(height), SVG_HEIGHT));

  const newViewBox = `0 0 ${clampedWidth}, ${clampedHeight}`;

  const { chain, state } = commandProps,
        { pos: prevPos } = state.selection.$anchor;

  return chain()
        .updateAttributes(NodeName.SVG, { width: clampedWidth, height: clampedHeight, viewBox: newViewBox })
        .setNodeSelection(prevPos)
        .run();
};

// -- Tool ------------------------------------------------------------------------
/**
 * Sets the currently active {@link ToolDefinition} for the currently selected SVG.
 * If a Shape inside the SVG is selected, it looks for the parent SVG and sets its
 * Tool. If an SVG is selected, it sets the tool for it.
 */
export const setSVGTool = (props: CommandProps, toolDefinition: ToolDefinition): boolean => {
  const { editor } = props,
        { selection } = editor.state;

  if(editor.state.plugins.map(plugin => plugin.spec.key).includes(shapeCreateKey)) {
    console.warn('Cannot create another rectangle while a rectangle is being created');
    return false;
  } /* else -- there are no shapes currently being created */

  if(!isNodeSelection(selection)) throw new Error('setSVGTool should be called from an SVG or a shape NodeSelection');

  let svgNodeView: SVGNodeView | undefined;
  if(selection.node.type.name === NodeName.RECTANGLE) svgNodeView = getSVGNodeViewFromSelection(editor, selection);
  else if(isSVGNode(selection.node)) svgNodeView = getSVGNodeViewFromSelection(editor, selection)!;
  else throw new Error(`Unknown SVG node type (${selection.node.type.name}).`);

  if(!svgNodeView) throw new Error(`non existent SVGNodeView for selection: ${JSON.stringify(selection)}`);
  svgNodeView.setActiveTool(toolDefinition);

  return true;
};

// == Shape =======================================================================
/**
 * Updates the attributes of the currently selected shape inside the
 * currently selected {@link SVGNodeView}, doing so by ID to ensure only the specific
 * shape has its attributes updated
 */
export const updateShapeAttributes = (props: CommandProps, shapeAttributes: Partial<RectangleAttributes>) => {
  const { id } = shapeAttributes;
  const { editor, state, dispatch, tr } = props,
        { selection } = editor.state;

  if(!dispatch) throw new Error('Dispatch function undefined when it should not');
  if(!isNodeSelection(selection) || selection.node.type.name !== NodeName.RECTANGLE) throw new Error(`Incorrect usage of updateShapeAttributes: expected shape but found ${JSON.stringify(selection)}`);

  tr.selection.ranges.forEach(range => {
    const from = range.$from.pos,
          to = range.$to.pos;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if(node.attrs.id === id)
        tr.setNodeMarkup(pos, undefined/*preserve node type*/, { ...node.attrs, ...shapeAttributes });
      /* else -- do nothing */
    });
  });

  return true;
};

// ................................................................................
// NOTE: this represents the order of the children shapes which is the z-order
export enum IndexChange { Bottom, Decrease, Increase, Top }
/**
 * Updates the order in which the content of a {@link SVGNodeView} is arranged by
 * changing the content index of the currently selected shape inside of it
*/
export const updateShapeOrder = (props: CommandProps, indexChange: IndexChange, shapeAttrsCallback: (attrs: any) => boolean): boolean => {
  const { dispatch, tr } = props;

  if(!dispatch) throw new Error('Dispatch function undefined when it should not');

  const { selection } = props.editor.state;
  if(!isNodeSelection(selection)) throw new Error('Running updateShapeOrder command without NodeSelection');

  const svgNode = selection.$anchor.parent/*NOTE: Guaranteed to be the svg by command call context contract. This might change later*/,
        shapeNode = selection.node,
        shapeNodePosition = getNodeOffset(svgNode, selection.node) - 1/*0 indexed*/;

  const childCount = svgNode.content.childCount;
  if(childCount < 1) return false/*nothing to do*/;

  let newShapeNodePosition = 0/*default send to back*/;
  switch(indexChange) {
    case IndexChange.Bottom:
      break/*use default*/;
    case IndexChange.Decrease:
      newShapeNodePosition = shapeNodePosition - 1;
      break;
    case IndexChange.Top:
      newShapeNodePosition = childCount;
      break;
    case IndexChange.Increase:
      newShapeNodePosition = shapeNodePosition + 1;
      break;
  }
  if(newShapeNodePosition < 0) newShapeNodePosition = IndexChange.Bottom;
  if(newShapeNodePosition > (childCount - 1/*0 indexed*/)) newShapeNodePosition = childCount - 1/*0 indexed*/;
  if(shapeNodePosition === newShapeNodePosition) return false/*nothing to do*/;

  const svgAttributes = svgNode.attrs;
  if(!isSVGAttributes(svgAttributes)) throw new Error('Invalid attributes for parent SVG');

  const newSVGNodeContent: ProseMirrorNode<NotebookSchemaType>[] = [];
  svgNode.content.forEach(node => newSVGNodeContent.push(node));

  // remove node from its original position
  newSVGNodeContent.splice(newSVGNodeContent.indexOf(shapeNode), 1/*only remove that item*/);

  // append node at the new position and create newSVGNode
  newSVGNodeContent.splice(newShapeNodePosition, 0/*don't delete, just insert*/, shapeNode);
  const newSVGNode = createSVGNode(props.editor.schema, svgAttributes, Fragment.fromArray(newSVGNodeContent));

  // select container SVG
  const svgNodePosBeforeReplacement = tr.doc.resolve(selection.$anchor.pos/*where the anchor currently is*/ - selection.$anchor.parentOffset/*how deep into the svg it is*/ - 1/*the parent position is 1 before*/);
        tr.setSelection(new NodeSelection(svgNodePosBeforeReplacement));
  replaceSVGNodeAndSelectShape(newSVGNode, shapeNode, shapeAttrsCallback, tr);
  dispatch(tr);

  return true;
};

// -- Rectangle -------------------------------------------------------------------
/**
 * Creates a new Rectangle node, appends it to a new SVGNode that has the content
 * of the selected SVGNode at function call time, and replaces the old SVGNode with
 * the newly created one, selecting the newly created rectangle afterwards
 */
export const insertAndSelectRectangle = (state: EditorState<NotebookSchemaType>, dispatch: ((tr: Transaction<NotebookSchemaType>) => void) | undefined, tr: Transaction<NotebookSchemaType>, attributes?: RectangleAttributes): boolean => {
  if(!dispatch) throw new Error('dispatch is undefined when it should not');

  const { schema, selection } = state;
  if(!isNodeSelection(selection)) {
    console.warn(`insertAndSelectRectangle must be called from within a node selection but found: ${JSON.stringify(selection)}`);
    return false/*rectangle was pasted in paragraph -- will be handled by PM by creating a new SVGNode and inserting the rectangle inside*/;
  }/* else -- paste rectangle inside selected svg */

  let parentSVG: SVGNodeType;
  if(isSVGNode(selection.node)) parentSVG = selection.node;
  else {
    const parentSelection = getResolvedParentSelectionByAnchorOffset(selection, tr);
    tr.setSelection(parentSelection);

    if(!isNodeSelection(parentSelection) || !isSVGNode(parentSelection.node)) throw new Error(`Parent of Shape selection is -not- an SVG node.`);
    parentSVG = parentSelection.node;
  }

  const rectangle = createRectangleNode(schema, attributes ? attributes : createDefaultRectangleAttributes(), undefined/*no content*/),
        newSVGNode = createSVGNode(schema, parentSVG.attrs, createFragmentWithAppendedContent(parentSVG, rectangle));
  replaceSVGNodeAndSelectShape(newSVGNode, rectangle, isRectangleAttributes, tr);
  dispatch(tr);

  return true;
};

// == Util ========================================================================
/**
 * Replaces the currently selected SVGNode with the given one and selects the
 * specified given shapeNode once the replacement has been performed
 *
 * @param svgNode The new SVGNode that will replace the currently selected SVGNode
 * @param shapeNode The shapeNode inside the new SVGNode that will be selected
 *        after the replacement happens
 * @param shapeAttrsCallback The callback that is used to validate that the attributes
 *        of the shape that will be selected after the replacement are correct
 * @param tr The {@link Transaction} object that will be used to perform the
 *        replacement and setSelection operations
 */
const replaceSVGNodeAndSelectShape = (svgNode: SVGNodeType, shapeNode: ProseMirrorNode<NotebookSchemaType>, shapeAttrsCallback: (attrs: any) => boolean, tr: Transaction<NotebookSchemaType>) => {
  const { selection } = tr;
  if(!isNodeSelection(selection) || !isSVGNode(selection.node)) throw new Error(`replaceSVGNodeAndSelectShape, expected selection to be NodeSelection of type SVG, but found ${selection}`);
  if(!shapeAttrsCallback(shapeNode.attrs)) throw new Error('replaceSVGNodeAndSelectShape, given nodes have wrong attrs');

  tr.replaceSelectionWith(svgNode);

  const newRectangleOffset = getNodeOffset(svgNode, shapeNode);
  const resolvedPosAfterInsertion = getResolvedAnchorPos(tr, newRectangleOffset);
        tr.setSelection(new NodeSelection(resolvedPosAfterInsertion));
};

// == Util ========================================================================
export const getSVGNodeViewFromSelection = (editor: Editor, selection: NodeSelection<NotebookSchemaType>): SVGNodeView | undefined/*no SVG in selection*/ => {
  const { node } = selection;
  let isShape = false;
  if(node.type.name === NodeName.RECTANGLE) isShape = true;

  if(!isSVGNode(node) && !isShape) {
    return undefined/* not an SVGNode, not a shape */;
  } /* else -- selectedNode is an SVGNode or a shape  */

  const svgStorage = editor.storage[NodeName.SVG] as SVGStorage;
  return svgStorage.getNodeView(isShape ? selection.$anchor.parent.attrs.id : node.attrs.id);
};

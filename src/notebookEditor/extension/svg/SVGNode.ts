import { mergeAttributes, Node } from '@tiptap/core';

import { isSVGNode, AttributeType, NotebookSchemaType, NodeName, RectangleAttributes, SetAttributeType, SVGAttributes, SVGNodeSpec, SVGNodeType, SVG_ID, SVG_VIEWBOX, SVG_WIDTH, SVG_HEIGHT, SVG_ASPECT_RATIO } from 'common';

import { isNodeSelection, NodeContent } from 'notebookEditor/extension/util/node';
import { NoOptions } from 'notebookEditor/model/type';

import { setAttributeParsingBehavior } from '../util/attribute';
import { getSVGNodeViewFromSelection, insertAndSelectRectangle, insertAndSelectSVGNode, setSVGTool, updateShapeAttributes, updateShapeOrder, updateSVGDimension } from './command';
import { shapeCut } from './plugin/shapeCut';
import { shapeMove } from './plugin/shapeMove';
import { shapePaste } from './plugin/shapePaste';
import { SVGNodeView } from './SVGNodeView';
import { SVGStorage } from './SVGStorage';
import { Dimension } from './util/math';

// ********************************************************************************
// == Node ========================================================================
// SEE: README.md for naming conventions
export const SVGNode = Node.create<NoOptions, SVGStorage>({
  ...SVGNodeSpec,

  // -- Attribute -----------------------------------------------------------------
  addAttributes() {
    return {
      // -- Logic -----------------------------------------------------------------
      [AttributeType.Id]: setAttributeParsingBehavior(AttributeType.Id, SetAttributeType.STRING, SVG_ID),

      // -- UI --------------------------------------------------------------------
      [AttributeType.ViewBox]: setAttributeParsingBehavior(AttributeType.ViewBox, SetAttributeType.STRING, SVG_VIEWBOX),
      [AttributeType.Width]: setAttributeParsingBehavior(AttributeType.Width, SetAttributeType.STRING, SVG_WIDTH),
      [AttributeType.Height]: setAttributeParsingBehavior(AttributeType.Height, SetAttributeType.STRING, SVG_HEIGHT),
      [AttributeType.PreserveAspectRatio]: setAttributeParsingBehavior(AttributeType.PreserveAspectRatio, SetAttributeType.STRING, SVG_ASPECT_RATIO),
    };
  },

  // -- Command -------------------------------------------------------------------
  addCommands() {
    return {
      // .. SVG ...................................................................
      insertSVG: () => (commandProps) => insertAndSelectSVGNode(commandProps, undefined/*empty svg*/),
      updateSVGDimension: (dimension: Dimension) => (commandProps) => updateSVGDimension(commandProps, dimension),

      // .. Tool ..................................................................
      setSVGTool: (toolDefinition) => (commandProps) => setSVGTool(commandProps, toolDefinition),

      // .. Shape .................................................................
      updateShapeAttributes: (attrs) => (commandProps) => updateShapeAttributes(commandProps, attrs),
      updateShapeOrder: (indexChange, shapeAttrsCallback) => (commandProps) => updateShapeOrder(commandProps, indexChange, shapeAttrsCallback),

      // .. Rectangle .............................................................
      insertRectangle: (attributes?: RectangleAttributes) => ({ state, dispatch, tr }) => insertAndSelectRectangle(state, dispatch, tr, attributes),
    };
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins() { return [shapeCut(), shapeMove(), shapePaste()]; },

  // -- Storage -------------------------------------------------------------------
  addStorage() { return new SVGStorage(); },

  // -- Update --------------------------------------------------------------------
  onSelectionUpdate() { /*called on *every* selection change (even non-SVG)*/
    const { selection } = this.editor.state;

    // if there is an SVG or child Shape selected then ensure that the SVG is
    // selected in storage. Otherwise unselect anything related to SVG.
    let svgNodeView: SVGNodeView | undefined = undefined/*default none selected*/;
    if(isNodeSelection(selection)) {
      switch(selection.node.type.name) {
        case NodeName.SVG:
          svgNodeView = getSVGNodeViewFromSelection(this.editor, selection)!;
          svgNodeView.selectSVGNode();
          break;

        // CHECK: why isn't the Shape node itself handling its own selection?!?
        case NodeName.RECTANGLE:
          svgNodeView = getSVGNodeViewFromSelection(this.editor, selection);
          if(!svgNodeView) throw new Error(`non existent SVGNodeView for selection: ${JSON.stringify(selection)}`);

          const rectContentEntry = svgNodeView.contentEntryMap.get(selection.node.attrs.id);
          if(!rectContentEntry) throw new Error(`Non existent svgViewEntry for node ${JSON.stringify(selection.node)}`);
          svgNodeView.selectContentEntry(rectContentEntry);

          break;

        // default: any other (non-SVG) Node
      }
    } /* else -- there are no nodes selected. By definition, no SVG is selected */

    // unselect any SVG and its shapes as the selection may have changed from an
    // SVG to a non SVG
    this.storage.unselectAll(svgNodeView);
  },

  // -- View ----------------------------------------------------------------------
  addNodeView() {
    return ({ editor, node, getPos }) => {
      if(!isSVGNode(node)) throw new Error(`Unexpected node type (${node.type.name}) while adding SVG NodeView.`);
      return new SVGNodeView(editor, node, this.storage, getPos);
    };
  },

  parseHTML() { return [{ tag: NodeName.SVG }]; },
  renderHTML({ HTMLAttributes }) { return [NodeName.SVG, mergeAttributes(HTMLAttributes)/*add attrs to pasted html*/, 0]; },
});

// ================================================================================
// .. Create ......................................................................
export const createSVGNode = (schema: NotebookSchemaType, attributes: SVGAttributes, content: NodeContent | undefined): SVGNodeType =>
  schema.nodes.svg.create(attributes, content) as SVGNodeType/*by definition*/;

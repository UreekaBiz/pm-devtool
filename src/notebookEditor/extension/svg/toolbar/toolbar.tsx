import { isSVGNode, isSVGAttributes, NodeName, SVG_WIDTH_TOOL, SVG_HEIGHT_TOOL } from 'common';

import { isNodeSelection, parentIsOfType, selectionIsOfType } from 'notebookEditor/extension/util/node';
import { isNumericRegExp } from 'notebookEditor/extension/util/parse';
import { Toolbar, ToolItem } from 'notebookEditor/toolbar/type';
import { BiRectangle } from 'react-icons/bi';
import { ImSvg } from 'react-icons/im';

import { getSVGNodeViewFromSelection } from '../command';
import { rectangleToolDefinition } from '../tool/tool';
import { InputToolContainerUI } from './InputToolContainerUI';

//*********************************************************************************
// == Tool Items ==================================================================
export const svg: ToolItem = {
  toolType: 'button',

  name: NodeName.SVG,
  label: NodeName.SVG,

  icon: <ImSvg size={16} />,
  tooltip: 'Add an SVG',

  shouldShow: (editor) => parentIsOfType(editor.state.selection, NodeName.PARAGRAPH),
  shouldBeDisabled: (editor) => isNodeSelection(editor.state.selection) || isSVGNode(editor.state.selection.$anchor.parent),
  onClick: (editor) => editor.chain().focus().insertSVG().run(),
};

export const svgRectangle: ToolItem = {
  toolType: 'button',

  name: NodeName.RECTANGLE,
  label: NodeName.RECTANGLE,

  icon: <BiRectangle size={16} />,
  tooltip: 'Add a Rectangle',

  shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.SVG) || selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
  shouldBeDisabled: (editor) => !editor.isActive(NodeName.SVG),
  onClick: (editor) => editor.chain().focus().setSVGTool(rectangleToolDefinition).run(),
};

// == Toolbar =====================================================================
export const SVGToolbar: Toolbar = {
  nodeName: NodeName.SVG,
  toolsCollections: [
    [svgRectangle],
    [
      {
        toolType: 'component',
        name: SVG_WIDTH_TOOL,
        component: ({ editor }) => {
          const { selection } = editor.state;
          if(!isNodeSelection(selection)) throw new Error('Invalid SVGWidthTool render');
          let { attrs } = selection.node;

          if(!isSVGNode(selection.node)) {
            const parentSVGEntry = getSVGNodeViewFromSelection(editor, selection);
            if(!parentSVGEntry) throw new Error(`non existent SVGNodeView for selection: ${JSON.stringify(selection)}`);

            attrs = parentSVGEntry.node.attrs;
            if(!isSVGAttributes(attrs)) throw new Error('Attrs are not SVGAttributes when they should');
          } /* else -- SVG already selected */

          return (
            <InputToolContainerUI
              toolName={SVG_WIDTH_TOOL}
              toolTitle={'Width'}
              currentValue={attrs.width.toString()}
              updateValueCallback={(width) => {
                if(!isNumericRegExp.test(width)) return;
                editor.commands.updateSVGDimension({ width: Number(width), height: attrs.height });
              }}
            />
          );
        },
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.SVG) || parentIsOfType(editor.state.selection, NodeName.SVG),
        shouldBeDisabled: (editor) => !editor.isActive(NodeName.SVG),
      },
      {
        toolType: 'component',
        name: SVG_HEIGHT_TOOL,
        component: ({ editor }) => {
          const { selection } = editor.state;
          if(!isNodeSelection(selection)) throw new Error('Invalid SVGHeightTool render');
          let { attrs } = selection.node;

          if(!isSVGNode(selection.node)) {
            const parentSVGEntry = getSVGNodeViewFromSelection(editor, selection);
            if(!parentSVGEntry) throw new Error(`non existent SVGNodeView for selection: ${JSON.stringify(selection)}`);

            attrs = parentSVGEntry.node.attrs;
            if(!isSVGAttributes(attrs)) throw new Error('Attrs are not SVGAttributes when they should');
          } /* else -- svg already selected */

          return (
            <InputToolContainerUI
              toolName={SVG_HEIGHT_TOOL}
              toolTitle={'Height'}
              currentValue={attrs.height.toString()}
              updateValueCallback={(height) => {
                if(!isNumericRegExp.test(height)) return;
                editor.commands.updateSVGDimension({ width: attrs.width, height: Number(height) });
              }}
            />
          );
        },
        shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.SVG) || parentIsOfType(editor.state.selection, NodeName.SVG),
        shouldBeDisabled: (editor) => !editor.isActive(NodeName.SVG),
      },
    ],
  ],
};

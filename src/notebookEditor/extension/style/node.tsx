import { isNodeSelection } from '@tiptap/core';
import { BiRectangle } from 'react-icons/bi';
import { ImSvg } from 'react-icons/im';

import { isSVGNode, NodeName } from 'common';

import { parentIsOfType, selectionIsOfType } from 'notebookEditor/extension/util/node';
import { rectangleToolDefinition } from 'notebookEditor/extension/svg/tool/tool';
import { ToolItem } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Common Nodes ================================================================
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

export const commonNodes = [ svg ];

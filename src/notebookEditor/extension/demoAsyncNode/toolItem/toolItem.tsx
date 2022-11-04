import { AiOutlineClockCircle } from 'react-icons/ai';

import { getSelectedNode, isAsyncNode, isDemoAsyncNode, AttributeType, NodeName } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { CodeBlockReferencesChipSelector } from 'notebookEditor/extension/codeblock';
import { SliderToolItem } from 'notebookEditor/extension/shared/component/SliderToolItem';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { insertAndSelectDemoAsyncNodeCommand } from '../command';

//*********************************************************************************
// == Tool Items ==================================================================
// disable tool item if current selected node or its parent is a CodeBlock node
export const demoAsyncNodeToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.DEMO_ASYNC_NODE,
  label: NodeName.DEMO_ASYNC_NODE,

  icon: <AiOutlineClockCircle size={16} />,
  tooltip: 'Demo Async Node (⌘ + ⌥ + D)',

  shouldBeDisabled: (editor) => {
    const node = getSelectedNode(editor.view.state);
    const { selection } = editor.view.state;
    if(node && isDemoAsyncNode(node)) return true/*(SEE: comment above)*/;

    const parentNode = selection.$anchor.parent;
    if(isAsyncNode(parentNode)) return true/*(SEE: comment above)*/;

    return false/*enabled*/;
  },
  shouldShow: (editor, depth) => depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/,
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, insertAndSelectDemoAsyncNodeCommand),
};

export const demoAsyncNodeDelayToolItem: ToolItem = {
  toolType: 'component',
  name: 'demoAsyncNodeDelayTool',

  component: (props) =>
    <SliderToolItem
      {...props}
      name='Delay (ms)'
      attributeType={AttributeType.Delay}
      nodeName={NodeName.DEMO_ASYNC_NODE}
      minValue={0}
      maxValue={4000}
      step={50}
      fixedDecimals={1}
    />,
};

export const demoAsyncNodeChipToolItem: ToolItem = {
  toolType: 'component',
  name: 'demoAsyncNodeChipTool',

  component: (props) =>
    <CodeBlockReferencesChipSelector
      {...props}
      nodeName={NodeName.DEMO_ASYNC_NODE}
    />,
};

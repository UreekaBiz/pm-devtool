import { MdFindReplace } from 'react-icons/md';

import { generateNodeId, isNodeSelection, AttributeType, NodeName } from 'common';

import { toggleBlock } from 'notebookEditor/command';
import { SliderToolItem } from 'notebookEditor/extension/shared/component/SliderToolItem';
import { InputToolItem } from 'notebookEditor/extension/shared/component/InputToolItem';
import { ToolItem } from 'notebookEditor/toolbar/type';
import { shouldShowToolItem } from 'notebookEditor/toolbar/util';

//*********************************************************************************
// == Tool Items ==================================================================
export const demoAsyncNode2ToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.DEMO_ASYNC_NODE_2,
  label: NodeName.DEMO_ASYNC_NODE_2,

  icon: <MdFindReplace size={16} />,
  tooltip: 'Demo 2 Async Node (⌘ + ⇧ + ⌥ + D)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  onClick: (editor) => toggleBlock(editor, NodeName.DEMO_ASYNC_NODE_2, { [AttributeType.Id]: generateNodeId() }),
};

export const demoAsyncNode2ReplaceTextToolItem: ToolItem = {
  toolType: 'component',
  name: 'DemoAsyncNode2ReplaceTextToolItem',

  component: (props) =>
    <InputToolItem
      {...props}
      name='Replace Text'
      attributeType={AttributeType.TextToReplace}
      nodeName={NodeName.DEMO_ASYNC_NODE_2}
    />,
};

export const demoAsyncNode2DelaySlider: ToolItem = {
  toolType: 'component',
  name: 'DemoAsyncNode2DelaySlider',

  component: (props) =>
    <SliderToolItem
      {...props}
      name='Delay (ms)'
      attributeType={AttributeType.Delay}
      nodeName={NodeName.DEMO_ASYNC_NODE_2}
      minValue={0}
      maxValue={4000}
      step={50}
      fixedDecimals={1}
    />,
};

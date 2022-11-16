import { VscReferences } from 'react-icons/vsc';

import { isNodeSelection, NodeName } from 'common';

import { CodeBlockReferenceChipSelector } from 'notebookEditor/extension/codeblock/toolItem';
import { shouldShowToolItem } from 'notebookEditor/extension/util/ui';
import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { ToolItem } from 'notebookEditor/toolbar/type';

import { insertAndSelectCodeBlockReferenceCommand } from '../command';
import { CodeBlockReferenceDelimiterToolItem } from './CodeBlockReferenceDelimiterToolItem/CodeBlockReferenceDelimiterToolItem';

//*********************************************************************************
// == Tool Items ==================================================================
export const codeBlockReferenceToolItem: ToolItem = {
  toolType: 'button',
  name: NodeName.CODEBLOCK_REFERENCE,
  label: NodeName.CODEBLOCK_REFERENCE,

  icon: <VscReferences size={16} />,
  tooltip: 'Code Block Reference (⌘ + ⇧ + ⌥ + C)',

  shouldBeDisabled: (editor) => isNodeSelection(editor.view.state.selection),
  shouldShow: (editor, depth) => shouldShowToolItem(editor, depth),
  onClick: (editor, depth) => toolItemCommandWrapper(editor, depth, insertAndSelectCodeBlockReferenceCommand),
};

export const codeBlockReferenceDelimiterToolItem: ToolItem = {
  toolType: 'component',
  name: 'codeBlockReferenceDelimiterToolItem',

  component: CodeBlockReferenceDelimiterToolItem,
};

export const codeBlockReferenceChipSelector: ToolItem = {
  toolType: 'component',
  name: 'CodeBlockReferenceChipSelector',

  component: (props) =>
    <CodeBlockReferenceChipSelector
      {...props}
      nodeName={NodeName.CODEBLOCK_REFERENCE}
    />,
};

import { MarkName, NodeName } from 'common';

import { blockquoteBorderColorToolItem, blockquoteBorderLeftWidthToolItem } from 'notebookEditor/extension/blockquote';
import { codeBlockTypeToolItem, codeBlockWrapToolItem } from 'notebookEditor/extension/codeblock';
import { codeBlockReferenceChipSelector, codeBlockReferenceDelimiterToolItem } from 'notebookEditor/extension/codeBlockReference';
import { demoAsyncNodeChipToolItem, demoAsyncNodeDelayToolItem, DemoAsyncNodeExecuteButtons } from 'notebookEditor/extension/demoAsyncNode';
import { demoAsyncNode2DelaySlider, demoAsyncNode2ReplaceTextToolItem, DemoAsyncNode2ExecuteButtons } from 'notebookEditor/extension/demoAsyncNode2';
import { previewPublishedNotebookToolItem, setThemeToolItem } from 'notebookEditor/extension/document';
import { horizontalRuleColorToolItem, horizontalRuleHeightToolItem } from 'notebookEditor/extension/horizontalRule';
import { imageAltToolItem, imageBorderToolItem, imageHeightToolItem, imageSrcToolItem, imageTitleToolItem, imageWidthToolItem, verticalAlignBottomToolItem, verticalAlignMiddleToolItem, verticalAlignTopToolItem } from 'notebookEditor/extension/image';
import { linkColorToolItem, linkTargetToolItem, linkURLToolItem } from 'notebookEditor/extension/link';
import { cellToolItems, generalTableToolItems } from 'notebookEditor/extension/table';

import { EditorToolComponentProps, ToolItem } from '../type';

// ********************************************************************************
// == Type ========================================================================
/**
 * {@link ToolItem}s that should only be added to a specific
 * {@link ProseMirrorNode} or {@link ProseMirrorMark}'s {@link Toolbar}, as
 * well as the rightContent, if any
 *
 * the given position determines whether they appear at the start or at the
 * end of their neighboring default ToolItems
 */
 type UniqueToolItemConfiguration = {
  position: 'start' | 'end';
  items: ToolItem[];
  rightContent?: React.FC<EditorToolComponentProps>;
};

// == Constant ====================================================================
const defaultUniqueToolItemConfiguration: UniqueToolItemConfiguration= { position: 'start', items: [/*none*/] };

// == Unique Tool Item ============================================================
export const UNIQUE_TOOL_ITEMS: Record<NodeName | MarkName, UniqueToolItemConfiguration> = {
  // -- Node ----------------------------------------------------------------------
  [NodeName.BLOCKQUOTE]: {
    position: 'start',
    items: [
      blockquoteBorderColorToolItem,
      blockquoteBorderLeftWidthToolItem,
    ],
  },
  [NodeName.CELL]: {
    position: 'start',
    items: [...cellToolItems],
  },
  [NodeName.CODEBLOCK]: {
    position: 'start',
    items: [
      codeBlockTypeToolItem,
      codeBlockWrapToolItem,
    ],
  },
  [NodeName.CODEBLOCK_REFERENCE]: {
    position: 'start',
    items: [
      codeBlockReferenceDelimiterToolItem,
      codeBlockReferenceChipSelector,
    ],
  },
  [NodeName.DEMO_ASYNC_NODE]: {
    position: 'start',
    items: [
      demoAsyncNodeDelayToolItem,
      demoAsyncNodeChipToolItem,
    ],
    rightContent: DemoAsyncNodeExecuteButtons,
  },
  [NodeName.DEMO_ASYNC_NODE_2]: {
    position: 'start',
    items: [
      demoAsyncNode2ReplaceTextToolItem,
      demoAsyncNode2DelaySlider,
  ],
    rightContent: DemoAsyncNode2ExecuteButtons,
  },
  [NodeName.DOC]: {
    position: 'end',
    items: [
      previewPublishedNotebookToolItem,
      setThemeToolItem,
    ],
  },
  [NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT]: defaultUniqueToolItemConfiguration,
  [NodeName.HEADER_CELL]: {
    position: 'start',
    items: [...cellToolItems],
  },
  [NodeName.HEADING]: defaultUniqueToolItemConfiguration,
  [NodeName.HORIZONTAL_RULE]: {
    position: 'start',
    items: [
      horizontalRuleColorToolItem,
      horizontalRuleHeightToolItem,
    ],
  },
  [NodeName.IMAGE]: {
    position: 'start',
    items: [
      imageSrcToolItem,
      imageAltToolItem,
      imageTitleToolItem,
      imageWidthToolItem,
      imageHeightToolItem,
      imageBorderToolItem,
      verticalAlignBottomToolItem,
      verticalAlignMiddleToolItem,
      verticalAlignTopToolItem,
    ],
  },
  [NodeName.MARK_HOLDER]: defaultUniqueToolItemConfiguration,
  [NodeName.NESTED_VIEW_BLOCK_NODE]: defaultUniqueToolItemConfiguration,
  [NodeName.ROW]: defaultUniqueToolItemConfiguration,
  [NodeName.PARAGRAPH]: defaultUniqueToolItemConfiguration,
  [NodeName.TABLE]: {
    position: 'start',
    items: [...generalTableToolItems],
  },
  [NodeName.TEXT]: defaultUniqueToolItemConfiguration,

  // -- Mark ----------------------------------------------------------------------
  [MarkName.BOLD]: defaultUniqueToolItemConfiguration,
  [MarkName.CODE]: defaultUniqueToolItemConfiguration,
  [MarkName.ITALIC]: defaultUniqueToolItemConfiguration,
  [MarkName.LINK]: {
    position: 'end',
    items: [
      linkURLToolItem,
      linkTargetToolItem,
      linkColorToolItem,
    ],
  },
  [MarkName.REPLACED_TEXT_MARK]: defaultUniqueToolItemConfiguration,
  [MarkName.SUB_SCRIPT]: defaultUniqueToolItemConfiguration,
  [MarkName.SUPER_SCRIPT]: defaultUniqueToolItemConfiguration,
  [MarkName.STRIKETHROUGH]: defaultUniqueToolItemConfiguration,
  [MarkName.TEXT_STYLE]: defaultUniqueToolItemConfiguration,
  [MarkName.UNDERLINE]: defaultUniqueToolItemConfiguration,
};

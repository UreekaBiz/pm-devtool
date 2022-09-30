import { NodeName } from 'common';

import { markBold } from 'notebookEditor/extension/bold/toolbar';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough/toolbar';
import { fontSizeToolItem, spacingToolItem, textColorMarkToolItem } from 'notebookEditor/extension/textStyle/toolbar';
import { Toolbar, ToolItem } from 'notebookEditor/toolbar/type';

import { HeadingLevelToolItem } from './HeadingLevelToolItem';

//*********************************************************************************
// == Tool Items ==================================================================
export const headingLevelToolItem: ToolItem = {
  toolType: 'component',
  name: 'headingLevelToolItem',

  shouldShow: (editor, depth) => depth === 1/*only show on the direct parent node of a TextNode*/,
  component: (props) => <HeadingLevelToolItem {...props}/>,
};

// == Toolbar =====================================================================
export const HeadingToolbar: Toolbar = {
  title: 'Heading',
  name: NodeName.HEADING/*Expected and guaranteed to be unique*/,

  toolsCollections: [
    [
      headingLevelToolItem,
      markBold,
      markStrikethrough,
    ],
    [
      fontSizeToolItem,
      textColorMarkToolItem,
    ],
    [
      spacingToolItem,
    ],
  ],
};

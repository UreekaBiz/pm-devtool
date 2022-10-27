import { NodeName } from 'common';

// import { markBold } from 'notebookEditor/extension/bold/toolbar';
// import { headingLevelToolItem } from 'notebookEditor/extension/heading/toolbar';
// import { markStrikethrough } from 'notebookEditor/extension/strikethrough/toolbar';
import { Toolbar } from 'notebookEditor/toolbar/type';

//*********************************************************************************
// == Toolbar =====================================================================
export const ParagraphToolbar: Toolbar = {
  title: 'Paragraph',
  name: NodeName.PARAGRAPH/*Expected and guaranteed to be unique*/,

  toolsCollections: [
    [
      // headingLevelToolItem,
      // markBold,
      // markStrikethrough,
      // backgroundColorToolItem,
    ],
    [
      // fontSizeToolItem,
      // textColorMarkToolItem,
      // backgroundColorMarkToolItem,
    ],
    [
      // spacingToolItem,
    ],
  ],
};

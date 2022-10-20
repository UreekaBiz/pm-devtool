import { NodeName } from 'common';

import { markBold } from 'notebookEditor/extension/bold/toolbar';
import { headingLevelToolItem } from 'notebookEditor/extension/heading/toolbar';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough/toolbar';
import { backgroundColorMarkToolItem, fontSizeToolItem, spacingToolItem, textColorMarkToolItem } from 'notebookEditor/extension/textStyle/toolbar';
import { Toolbar } from 'notebookEditor/toolbar/type';

//*********************************************************************************
// == Toolbar =====================================================================
export const ParagraphToolbar: Toolbar = {
  title: 'Paragraph',
  name: NodeName.PARAGRAPH/*Expected and guaranteed to be unique*/,

  toolsCollections: [
    [
      headingLevelToolItem,
      markBold,
      markStrikethrough,
    ],
    [
      fontSizeToolItem,
      textColorMarkToolItem,
      backgroundColorMarkToolItem,
    ],
    [
      spacingToolItem,
    ],
  ],
};

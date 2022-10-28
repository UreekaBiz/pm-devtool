import { NodeName } from 'common';

import { Toolbar } from 'notebookEditor/toolbar/type';

import { markBold } from 'notebookEditor/extension/bold';
import { headingLevelToolItem } from 'notebookEditor/extension/heading';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough';
import { backgroundColorToolItem, fontSizeToolItem, textColorMarkToolItem, backgroundColorMarkToolItem, spacingToolItem } from '../textStyle';

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
      backgroundColorToolItem,
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

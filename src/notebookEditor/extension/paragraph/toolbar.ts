import { NodeName } from 'common';

import { Toolbar } from 'notebookEditor/toolbar/type';

import { markBold } from 'notebookEditor/extension/bold';
import { markCode } from 'notebookEditor/extension/code';
import { headingLevelToolItem } from 'notebookEditor/extension/heading';
import { markStrikethrough } from 'notebookEditor/extension/strikethrough';
import { backgroundColorToolItem, fontSizeToolItem, textColorMarkToolItem, backgroundColorMarkToolItem, spacingToolItem } from 'notebookEditor/extension/textStyle';

//*********************************************************************************
// == Toolbar =====================================================================
export const ParagraphToolbar: Toolbar = {
  title: 'Paragraph',
  name: NodeName.PARAGRAPH/*Expected and guaranteed to be unique*/,

  toolsCollections: [
    [
      headingLevelToolItem,
      markBold,
      markCode,
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

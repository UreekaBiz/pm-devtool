import { Attributes, AttributeType, TextAlign, VerticalAlign } from '../attribute';
import { HeadingLevel } from '../extension/heading';
import { DATA_NODE_TYPE } from '../htmlRenderer/type';
import { MarkName } from '../mark';
import { NodeName } from '../node';

// ********************************************************************************
// == Element =====================================================================
// base type for all Theme Attributes. Each Node can implement its own theme type
// defining the Attributes required by the Theme.
// NOTE: the value for a given Attribute could be 'any' since there are complex
//       Nodes that requires render Attributes based on an external value (e.g.
//       Heading level).
export type ThemeElement<ElementAttributes extends Attributes = Attributes> = Partial<Record<keyof ElementAttributes, any>>;
export type NodeThemeElements = Record<NodeName, ThemeElement>;
export type MarkThemeElements = Record<MarkName, ThemeElement>

// -- Custom Selectors ------------------------------------------------------------
// Custom Selectors are used to select a specific Node based on more Attributes
// than just the Node name. This is useful when a Node requires a certain style
// based on an Attribute.
// NOTE: this uses an object instead of a enum since the values are using template
//       literals and cannot be used as values for the Enum
export const CustomSelector = {
  HeadingLevelOne: `[${DATA_NODE_TYPE}="${NodeName.HEADING}"][level="${HeadingLevel.One}"]`,
  HeadingLevelTwo: `[${DATA_NODE_TYPE}="${NodeName.HEADING}"][level="${HeadingLevel.Two}"]`,
  HeadingLevelThree: `[${DATA_NODE_TYPE}="${NodeName.HEADING}"][level="${HeadingLevel.Three}"]`,
  HeadingLevelFour: `[${DATA_NODE_TYPE}="${NodeName.HEADING}"][level="${HeadingLevel.Four}"]`,
  HeadingLevelFive: `[${DATA_NODE_TYPE}="${NodeName.HEADING}"][level="${HeadingLevel.Five}"]`,
  HeadingLevelSix: `[${DATA_NODE_TYPE}="${NodeName.HEADING}"][level="${HeadingLevel.Six}"]`,
} as const;
export type CustomThemeElements = Record<typeof CustomSelector[keyof typeof CustomSelector], ThemeElement>;

// == Theme ======================================================================
export enum ThemeName {
  Default = 'Default',
  GoogleDocs = 'Google Docs',
}
export interface Theme {
  /** the name that identifies the Theme */
  // NOTE: This name must be unique.
  name: ThemeName;
  /** the name that will be shown to the User */
  displayName: string;

  /** a record of themes defining the Attributes for each element */
  nodes: NodeThemeElements;
  marks: MarkThemeElements;

  /** custom selectors that style the Nodes with a complex selected (e.g. Heading
   *  levels */
  // SEE: CustomSelector
  customSelectors: CustomThemeElements;
}

// == Theme =======================================================================
export const DefaultTheme: Theme = {
  name: ThemeName.Default/*expected and guaranteed to be unique*/,
  displayName: 'Default',

  nodes:{
    [NodeName.BLOCKQUOTE]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.Color]: '#000000',
      [AttributeType.FontSize]: '16px',

      // NOTE: order is not arbitrary
      [AttributeType.BorderLeft]: '3px',
      [AttributeType.BorderColor]: '#CCCCCC',
      [AttributeType.MarginLeft]: '4px',
    },
    [NodeName.UNORDERED_LIST]: { [AttributeType.MarginLeft]: '1.5em' },
    [NodeName.CELL]: {/*no defined value*/},
    [NodeName.CODEBLOCK]: {
      [AttributeType.PaddingLeft]: '4px',
      [AttributeType.PaddingRight]: '4px',
      [AttributeType.PaddingTop]: '4px',
      [AttributeType.PaddingBottom]: '4px',

      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginRight]: '0px',
      [AttributeType.MarginTop]: '0.5rem',
      [AttributeType.MarginBottom]: '0.5rem',
    },
    [NodeName.CODEBLOCK_REFERENCE]: {
      [AttributeType.LeftDelimiter]: '(',
      [AttributeType.RightDelimiter]: ')',
    },
    [NodeName.DEMO_ASYNC_NODE]: {/*no defined value*/},
    [NodeName.DEMO_ASYNC_NODE_2]: {
      [AttributeType.PaddingLeft]: '4px',
      [AttributeType.PaddingRight]: '4px',
      [AttributeType.PaddingTop]: '4px',
      [AttributeType.PaddingBottom]: '4px',

      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginRight]: '4px',
      [AttributeType.MarginTop]: '0.5rem',
      [AttributeType.MarginBottom]: '0.5rem',
    },
    [NodeName.DOC]: {/*no defined value*/},
    [NodeName.EXCALIDRAW]: {/*no defined value*/},
    [NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT]: {/*no defined value*/},
    [NodeName.HEADER_CELL]: {/*no defined value*/},
    [NodeName.HEADING]: {
      [AttributeType.BackgroundColor]: '#F3F3F3',
      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginRight]: '4px',
      [AttributeType.MarginBottom]: '0.25rem',
    },
    [NodeName.HORIZONTAL_RULE]: {
      [AttributeType.BackgroundColor]: '#000',
      [AttributeType.Height]: '2px',
    },
    [NodeName.IMAGE]: {
      [AttributeType.Color]: '#000',
      [AttributeType.BorderWidth]: '1px',
      [AttributeType.BorderStyle]: 'solid',
      [AttributeType.TextAlign]: TextAlign.left,
      [AttributeType.VerticalAlign]: VerticalAlign.bottom,
    },
    [NodeName.LIST_ITEM]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.Color]: '#000000',
      [AttributeType.FontSize]: '16px',
    },
    [NodeName.MARK_HOLDER]: {/*no defined value*/},
    [NodeName.NESTED_VIEW_BLOCK_NODE]: {/*no defined value*/},
    [NodeName.ROW]: {/*no defined value*/},
    [NodeName.ORDERED_LIST]: { [AttributeType.MarginLeft]: '2em' },
    [NodeName.PARAGRAPH]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.Color]: '#000000',
      [AttributeType.FontSize]: '16px',
      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginRight]: '4px',
      [AttributeType.MarginTop]: '0.5rem',
      [AttributeType.MarginBottom]: '0.5rem',
    },
    [NodeName.TABLE]: {/*no defined value*/},
    [NodeName.TEXT]:{/*no defined value*/},
  },

  marks: {
    [MarkName.BOLD]:  {/*no defined value*/},
    [MarkName.CODE]:  {/*no defined value*/},
    [MarkName.ITALIC]:  {/*no defined value*/},
    [MarkName.LINK]:  {
      [AttributeType.Color]: '#1A73E8',
      [AttributeType.TextDecoration]: 'underline',
    },
    [MarkName.REPLACED_TEXT_MARK]:  {/*no defined value*/},
    [MarkName.SUB_SCRIPT]:  {/*no defined value*/},
    [MarkName.SUPER_SCRIPT]:  {/*no defined value*/},
    [MarkName.STRIKETHROUGH]:  {/*no defined value*/},
    [MarkName.TEXT_STYLE]:  {/*no defined value*/},
    [MarkName.UNDERLINE]:  {/*no defined value*/},
  },

  customSelectors: {
    [CustomSelector.HeadingLevelOne]: {
      [AttributeType.Color]: '#1C5987',
      [AttributeType.FontSize]: '34px',
    },
    [CustomSelector.HeadingLevelTwo]: {
      [AttributeType.FontSize]: '25px',
      [AttributeType.Color]: '#4E7246',
    },
    [CustomSelector.HeadingLevelThree]: {
      [AttributeType.FontSize]: '20px',
      [AttributeType.Color]: '#89B181',
    },
    [CustomSelector.HeadingLevelFour]: {
      [AttributeType.FontSize]: '15px',
      [AttributeType.Color]: '#89B181',
    },
    [CustomSelector.HeadingLevelFive]: {
      [AttributeType.FontSize]: '14px',
      [AttributeType.Color]: '#89B181',
    },
    [CustomSelector.HeadingLevelSix]: {
      [AttributeType.FontSize]: '13px',
      [AttributeType.Color]: '#89B181',
    },
  },
};

export const GoogleDocsTheme: Theme = {
  name: ThemeName.GoogleDocs/*expected and guaranteed to be unique*/,
  displayName: 'Default',

  nodes:{
    [NodeName.BLOCKQUOTE]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.Color]: '#000000',
      [AttributeType.FontSize]: '11pt',

      // NOTE: order of borders is not arbitrary
      [AttributeType.BorderLeft]: '3px',
      [AttributeType.BorderColor]: '#CCCCCC',
      [AttributeType.MarginLeft]: '4px',
    },
    [NodeName.UNORDERED_LIST]: { [AttributeType.MarginLeft]: '1.5em' },
    [NodeName.CELL]: {/*no defined value*/},
    [NodeName.CODEBLOCK]: {
      [AttributeType.PaddingLeft]: '4px',
      [AttributeType.PaddingRight]: '4px',
      [AttributeType.PaddingTop]: '4px',
      [AttributeType.PaddingBottom]: '4px',

      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginRight]: '0px',
      [AttributeType.MarginTop]: '0.5rem',
      [AttributeType.MarginBottom]: '0.5rem',
    },
    [NodeName.CODEBLOCK_REFERENCE]: {
      [AttributeType.LeftDelimiter]: '[',
      [AttributeType.RightDelimiter]: ']',
    },
    [NodeName.DEMO_ASYNC_NODE]: {/*no defined value*/},
    [NodeName.DEMO_ASYNC_NODE_2]: {
      [AttributeType.PaddingLeft]: '4px',
      [AttributeType.PaddingRight]: '4px',
      [AttributeType.PaddingTop]: '4px',
      [AttributeType.PaddingBottom]: '4px',

      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginRight]: '4px',
      [AttributeType.MarginTop]: '0.5rem',
      [AttributeType.MarginBottom]: '0.5rem',
    },
    [NodeName.DOC]: {/*no defined value*/},
    [NodeName.EXCALIDRAW]: {/*no defined value*/},
    [NodeName.EDITABLE_INLINE_NODE_WITH_CONTENT]: {/*no defined value*/},
    [NodeName.HEADER_CELL]: {/*no defined value*/},
    [NodeName.HEADING]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginBottom]: '0.25rem',
    },
    [NodeName.HORIZONTAL_RULE]: {
      [AttributeType.BackgroundColor]: '#000',
      [AttributeType.Height]: '2px',
    },
    [NodeName.IMAGE]: {
      [AttributeType.Color]: '#353744',
      [AttributeType.BorderWidth]: '1px',
      [AttributeType.BorderStyle]: 'solid',
      [AttributeType.TextAlign]: TextAlign.left,
      [AttributeType.VerticalAlign]: VerticalAlign.bottom,
    },
    [NodeName.LIST_ITEM]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.Color]: '#000000',
      [AttributeType.FontSize]: '16px',
    },
    [NodeName.MARK_HOLDER]: {/*no defined value*/},
    [NodeName.NESTED_VIEW_BLOCK_NODE]: {/*no defined value*/},
    [NodeName.ROW]: {/*no defined value*/},
    [NodeName.ORDERED_LIST]: { [AttributeType.MarginLeft]: '2em' },
    [NodeName.PARAGRAPH]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.Color]: '#353744',
      [AttributeType.FontSize]: '11pt',
      [AttributeType.MarginLeft]: '4px',
      [AttributeType.MarginRight]: '4px',
      [AttributeType.MarginTop]: '0.5rem',
      [AttributeType.MarginBottom]: '0.5rem',
    },
    [NodeName.TABLE]: {/*no defined value*/},
    [NodeName.TEXT]:{/*no defined value*/},
  },

  marks: {
    [MarkName.BOLD]:  {/*no defined value*/},
    [MarkName.CODE]:  {/*no defined value*/},
    [MarkName.ITALIC]:  {/*no defined value*/},
    [MarkName.LINK]:  {
      [AttributeType.Color]: '#1A73E8',
      [AttributeType.TextDecoration]: 'underline',
    },
    [MarkName.REPLACED_TEXT_MARK]:  {/*no defined value*/},
    [MarkName.SUB_SCRIPT]:  {/*no defined value*/},
    [MarkName.SUPER_SCRIPT]:  {/*no defined value*/},
    [MarkName.STRIKETHROUGH]:  {/*no defined value*/},
    [MarkName.TEXT_STYLE]:  {/*no defined value*/},
    [MarkName.UNDERLINE]:  {/*no defined value*/},
  },

  customSelectors: {
    [CustomSelector.HeadingLevelOne]: {
      [AttributeType.BackgroundColor]: '#FFFFFF',
      [AttributeType.Color]: '#00577C',
      [AttributeType.FontSize]: '14pt',
    },
    [CustomSelector.HeadingLevelTwo]: {
      [AttributeType.FontSize]: '13pt',
      [AttributeType.Color]: '#73AB84',
    },
    [CustomSelector.HeadingLevelThree]: {
      [AttributeType.FontSize]: '12pt',
      [AttributeType.Color]: '#353744',
    },
    [CustomSelector.HeadingLevelFour]: {
      [AttributeType.FontSize]: '11pt',
      [AttributeType.Color]: '#353744',
    },
    [CustomSelector.HeadingLevelFive]: {
      [AttributeType.FontSize]: '10pt',
      [AttributeType.Color]: '#353744',
    },
    [CustomSelector.HeadingLevelSix]: {
      [AttributeType.FontSize]: '9pt',
      [AttributeType.Color]: '#353744',
    },
  },
};

// --------------------------------------------------------------------------------
export const Themes: Record<ThemeName, Theme> = {
  [ThemeName.Default]: DefaultTheme,
  [ThemeName.GoogleDocs]: GoogleDocsTheme,
};

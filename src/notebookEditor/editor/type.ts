import { Extension } from 'notebookEditor/extension';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap';
import { Bold } from 'notebookEditor/extension/bold/Bold';
import { Document } from 'notebookEditor/extension/document';
import { EmojiSuggestion } from 'notebookEditor/extension/emojiSuggestion';
import { Heading } from 'notebookEditor/extension/heading';
import { History } from 'notebookEditor/extension/history';
import { MarkHolder } from 'notebookEditor/extension/markHolder';
import { Paragraph } from 'notebookEditor/extension/paragraph';
import { Strikethrough } from 'notebookEditor/extension/strikethrough';
import { Text } from 'notebookEditor/extension/text';
import { TextStyle } from 'notebookEditor/extension/textStyle';

// ********************************************************************************
// == Definition ==================================================================
/**
 * the set of extensions that get added to the Editor. Order is arbitrary since
 * the Editor orders them by priority (SEE: Editor.ts)
 */
export const editorDefinition: Extension[] = [
  BasicKeymap,
  Bold,
  EmojiSuggestion,
  History,
  Document,
  Heading,
  MarkHolder,
  Paragraph,
  Strikethrough,
  Text,
  TextStyle,
];

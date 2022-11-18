import { Extension } from 'notebookEditor/extension/type/Extension/Extension';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap/BasicKeymap';
import { Bold } from 'notebookEditor/extension/bold/Bold';
import { DefaultInputRules } from 'notebookEditor/extension/defaultInputRules/DefaultInputRules';
import { Document } from 'notebookEditor/extension/document/Document';
import { EmojiSuggestion } from 'notebookEditor/extension/emojiSuggestion/EmojiSuggestion';
import { GapCursor } from 'notebookEditor/extension/gapcursor/GapCursor';
import { Heading } from 'notebookEditor/extension/heading/Heading';
import { History } from 'notebookEditor/extension/history/History';
import { MarkHolder } from 'notebookEditor/extension/markHolder/MarkHolder';
import { Paragraph } from 'notebookEditor/extension/paragraph/Paragraph';
import { SelectionHandling } from 'notebookEditor/extension/selectionHandling/SelectionHandling';
import { Strikethrough } from 'notebookEditor/extension/strikethrough/Strikethrough';
import { Text } from 'notebookEditor/extension/text/Text';
import { TextStyle } from 'notebookEditor/extension/textStyle/TextStyle';

// ********************************************************************************
// == Definition ==================================================================
/**
 * the set of extensions that get added to the Editor. Order is arbitrary since
 * the Editor orders them by priority (SEE: Editor.ts)
 */
export const editorDefinition: Extension[] = [
  BasicKeymap,
  Bold,
  DefaultInputRules,
  Document,
  EmojiSuggestion,
  GapCursor,
  History,
  Heading,
  MarkHolder,
  Paragraph,
  SelectionHandling,
  Strikethrough,
  Text,
  TextStyle,
];

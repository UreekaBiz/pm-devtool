import { CodeBlock } from 'notebookEditor/codeblock';
import { CodeBlockReference } from 'notebookEditor/codeBlockReference';
import { Extension } from 'notebookEditor/extension';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap';
import { Blockquote } from 'notebookEditor/extension/blockquote';
import { Bold } from 'notebookEditor/extension/bold/Bold';
import { Code } from 'notebookEditor/extension/code';
import { DefaultInputRules } from 'notebookEditor/extension/defaultInputRules';
import { Document } from 'notebookEditor/extension/document';
import { EmojiSuggestion } from 'notebookEditor/extension/emojiSuggestion';
import { GapCursor } from 'notebookEditor/extension/gapcursor';
import { Heading } from 'notebookEditor/extension/heading';
import { History } from 'notebookEditor/extension/history';
import { HorizontalRule } from 'notebookEditor/extension/horizontalRule';
import { Image } from 'notebookEditor/extension/image';
import { Italic } from 'notebookEditor/extension/italic';
import { Link } from 'notebookEditor/extension/link';
import { MarkHolder } from 'notebookEditor/extension/markHolder';
import { EditableInlineNodeWithContent } from 'notebookEditor/extension/nestedViewNode/editableInlineNodeWithContent';
import { NestedViewBlockNode } from 'notebookEditor/extension/nestedViewNode/nestedViewBlockNode';
import { NestedViewNode } from 'notebookEditor/extension/nestedViewNode/NestedViewNode';
import { Paragraph } from 'notebookEditor/extension/paragraph';
import { ReplacedTextMark } from 'notebookEditor/extension/replacedTextMark';
import { SelectionHandling } from 'notebookEditor/extension/selectionHandling';
import { Strikethrough } from 'notebookEditor/extension/strikethrough';
import { SubScript } from 'notebookEditor/extension/subScript';
import { SuperScript } from 'notebookEditor/extension/superScript';
import { Text } from 'notebookEditor/extension/text';
import { TextStyle } from 'notebookEditor/extension/textStyle';
import { Underline } from 'notebookEditor/extension/underline';

// ********************************************************************************
// == Definition ==================================================================
/**
 * the set of extensions that get added to the Editor. Order is arbitrary since
 * the Editor orders them by priority (SEE: Editor.ts)
 */
export const editorDefinition: Extension[] = [
  BasicKeymap,
  Blockquote,
  Bold,
  Code,
  CodeBlock,
  CodeBlockReference,
  DefaultInputRules,
  Document,
  EditableInlineNodeWithContent,
  EmojiSuggestion,
  GapCursor,
  History,
  Heading,
  HorizontalRule,
  Image,
  Italic,
  Link,
  MarkHolder,
  NestedViewBlockNode,
  NestedViewNode,
  Paragraph,
  ReplacedTextMark,
  SelectionHandling,
  SubScript,
  SuperScript,
  Strikethrough,
  Text,
  TextStyle,
  Underline,
];

import { Extension } from 'notebookEditor/extension';
import { AsyncNode } from 'notebookEditor/extension/asyncNode';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap';
import { Blockquote } from 'notebookEditor/extension/blockquote';
import { Bold } from 'notebookEditor/extension/bold/Bold';
import { CodeBlock } from 'notebookEditor/extension/codeblock';
import { CodeBlockReference } from 'notebookEditor/extension/codeBlockReference';
import { Code } from 'notebookEditor/extension/code';
import { DemoAsyncNode } from 'notebookEditor/extension/demoAsyncNode';
import { DemoAsyncNode2 } from 'notebookEditor/extension/demoAsyncNode2';
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
import { BulletList } from 'notebookEditor/extension/list/bulletList';
import { ListItem } from 'notebookEditor/extension/list/listItem';
import { OrderedList } from 'notebookEditor/extension/list/orderedList';
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
import { Cell } from 'notebookEditor/extension/table/node/cell';
import { HeaderCell } from 'notebookEditor/extension/table/node/headerCell';
import { Row } from 'notebookEditor/extension/table/node/row';
import { Table } from 'notebookEditor/extension/table';
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
  AsyncNode,
  BasicKeymap,
  Blockquote,
  Bold,
  BulletList,
  Cell,
  Code,
  CodeBlock,
  CodeBlockReference,
  DemoAsyncNode,
  DemoAsyncNode2,
  DefaultInputRules,
  Document,
  EditableInlineNodeWithContent,
  EmojiSuggestion,
  GapCursor,
  HeaderCell,
  Heading,
  History,
  HorizontalRule,
  Image,
  Italic,
  Link,
  ListItem,
  MarkHolder,
  NestedViewBlockNode,
  NestedViewNode,
  OrderedList,
  Paragraph,
  ReplacedTextMark,
  Row,
  SelectionHandling,
  SubScript,
  SuperScript,
  Strikethrough,
  Table,
  Text,
  TextStyle,
  Underline,
];

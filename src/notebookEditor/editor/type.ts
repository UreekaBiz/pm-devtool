import { AsyncNode } from 'notebookEditor/extension/asyncNode/AsyncNode';
import { Blockquote } from 'notebookEditor/extension/blockquote/Blockquote';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap/BasicKeymap';
import { Bold } from 'notebookEditor/extension/bold/Bold';
import { Cell } from 'notebookEditor/extension/table/node/cell/Cell';
import { Code } from 'notebookEditor/extension/code/Code';
import { CodeBlock } from 'notebookEditor/extension/codeblock/CodeBlock';
import { CodeBlockReference } from 'notebookEditor/extension/codeBlockReference/CodeBlockReference';
import { DefaultInputRules } from 'notebookEditor/extension/defaultInputRules/DefaultInputRules';
import { DemoAsyncNode } from 'notebookEditor/extension/demoAsyncNode/DemoAsyncNode';
import { DemoAsyncNode2 } from 'notebookEditor/extension/demoAsyncNode2/DemoAsyncNode2';
import { Document } from 'notebookEditor/extension/document/Document';
import { EmojiSuggestion } from 'notebookEditor/extension/emojiSuggestion/EmojiSuggestion';
import { GapCursor } from 'notebookEditor/extension/gapcursor/GapCursor';
import { HeaderCell } from 'notebookEditor/extension/table/node/headerCell/HeaderCell';
import { Heading } from 'notebookEditor/extension/heading/Heading';
import { History } from 'notebookEditor/extension/history/History';
import { HorizontalRule } from 'notebookEditor/extension/horizontalRule/HorizontalRule';
import { Image } from 'notebookEditor/extension/image/Image';
import { Italic } from 'notebookEditor/extension/italic/Italic';
import { Link } from 'notebookEditor/extension/link/Link';
import { MarkHolder } from 'notebookEditor/extension/markHolder/MarkHolder';
import { EditableInlineNodeWithContent } from 'notebookEditor/extension/nestedViewNode/editableInlineNodeWithContent/EditableInlineNodeWithContent';
import { NestedViewBlockNode } from 'notebookEditor/extension/nestedViewNode/nestedViewBlockNode/NestedViewBlockNode';
import { NestedViewNode } from 'notebookEditor/extension/nestedViewNode/NestedViewNode';
import { ReplacedTextMark } from 'notebookEditor/extension/replacedTextMark/ReplacedTextMark';
import { Paragraph } from 'notebookEditor/extension/paragraph/Paragraph';
import { SelectionHandling } from 'notebookEditor/extension/selectionHandling/SelectionHandling';
import { Strikethrough } from 'notebookEditor/extension/strikethrough/Strikethrough';
import { SubScript } from 'notebookEditor/extension/subScript';
import { SuperScript } from 'notebookEditor/extension/superScript';
import { Row } from 'notebookEditor/extension/table/node/row/Row';
import { Table } from 'notebookEditor/extension/table/node/table/Table';
import { Extension } from 'notebookEditor/extension/type/Extension/Extension';
import { Text } from 'notebookEditor/extension/text/Text';
import { TextStyle } from 'notebookEditor/extension/textStyle/TextStyle';
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
  MarkHolder,
  NestedViewBlockNode,
  NestedViewNode,
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

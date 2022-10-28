import { Extension } from 'notebookEditor/extension';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap';
import { Bold } from 'notebookEditor/extension/bold/Bold';
import { Document } from 'notebookEditor/extension/document';
import { Heading } from 'notebookEditor/extension/heading';
import { History } from 'notebookEditor/extension/history';
import { MarkHolder } from 'notebookEditor/extension/markHolder';
import { Paragraph } from 'notebookEditor/extension/paragraph';
import { Text } from 'notebookEditor/extension/text';

// ********************************************************************************
// == Definition ==================================================================
/**
 * the set of extensions that get added to the Editor. Order is arbitrary since
 * the Editor orders them by priority (SEE: Editor.ts)
 */
export const editorDefinition: Extension[] = [
  BasicKeymap,
  Bold,
  History,
  Document,
  Heading,
  MarkHolder,
  Paragraph,
  Text,
];

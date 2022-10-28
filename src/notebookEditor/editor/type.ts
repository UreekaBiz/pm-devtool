import { Extension } from 'notebookEditor/extension';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap';
import { Document } from 'notebookEditor/extension/document';
import { Heading } from 'notebookEditor/extension/heading';
import { History } from 'notebookEditor/extension/history';
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
  History,
  Document,
  Heading,
  Paragraph,
  Text,
];

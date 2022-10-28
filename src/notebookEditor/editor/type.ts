import { Extension } from 'notebookEditor/extension';
import { Document } from 'notebookEditor/extension/document';
import { Paragraph } from 'notebookEditor/extension/paragraph';
import { Text } from 'notebookEditor/extension/text';

// ********************************************************************************
// the set of extensions that get added to the Editor
export const editorDefinition: Extension[] = [
  Document,
  Paragraph,
  Text,
];

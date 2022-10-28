import { Extension } from 'notebookEditor/extension';
import { Document } from 'notebookEditor/extension/document';

// ********************************************************************************
// the set of extensions that get added to the Editor
export const editorDefinition: Extension[] = [
  Document,
];

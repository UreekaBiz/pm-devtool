import { EditorState } from 'prosemirror-state';

import { isObject } from '../util';
import { DocumentNodeType } from './extension/document';
import { getSchema, NotebookSchemaVersion } from './schema';

// ********************************************************************************
// creates an instance of EditorState using the defined structure
export const createEditorState = (schemaVersion: NotebookSchemaVersion, doc?: DocumentNodeType): EditorState => {
  const schema = getSchema(schemaVersion);

  return EditorState.create({ schema, doc });
};

/** Type guard that defines if a value is a {@link EditorState} */
export const isEditorState = (value: unknown): value is EditorState => {
  return isObject(value) && value instanceof EditorState;
};

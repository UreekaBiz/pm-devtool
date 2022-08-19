import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { isObject } from '../util';

// ********************************************************************************
// creates an instance of EditorState using the defined structure
export const createEditorState = (schema: Schema, doc?: ProseMirrorNode): EditorState => {
  return EditorState.create({ schema, doc });
};

/** Type guard that defines if a value is a {@link EditorState} */
export const isEditorState = (value: unknown): value is EditorState => {
  return isObject(value) && value instanceof EditorState;
};

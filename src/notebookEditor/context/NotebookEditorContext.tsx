import { Editor } from '@tiptap/react';
import { createContext } from 'react';

// ********************************************************************************
export type NotebookEditorState = Readonly<{
  editor: Editor | null/*not initialized*/;
}>;

export const NotebookEditorContext = createContext<NotebookEditorState>({
  editor: null/*not initialized by default*/,
});
NotebookEditorContext.displayName = 'NotebookEditorContext';

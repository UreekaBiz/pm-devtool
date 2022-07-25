import { Editor } from '@tiptap/react';
import { createContext } from 'react';

// ********************************************************************************
export type NotebookState = Readonly<{
  editor: Editor | null/*not initialized*/;
}>;

export const NotebookContext = createContext<NotebookState>({
  editor: null/*not initialized by default*/,
});
NotebookContext.displayName = 'NotebookContext';

import { useEditor } from '@tiptap/react';

import { editorDefinition } from 'notebookEditor/type';

import { NotebookContext } from './NotebookContext';

// ********************************************************************************
interface Props { children: React.ReactNode; }
export const NotebookProvider: React.FC<Props> = ({ children }) => {
  const editor = useEditor(editorDefinition);

  return <NotebookContext.Provider value={{ editor }}>{children}</NotebookContext.Provider>;
};

import { useEditor } from '@tiptap/react';
import { useEffect } from 'react';

import { notebookEditorTheme } from 'notebookEditor/extension/theme/theme';
import { editorDefinition } from 'notebookEditor/type';

import { NotebookContext } from './NotebookContext';

// ********************************************************************************
interface Props { children: React.ReactNode; }
export const NotebookProvider: React.FC<Props> = ({ children }) => {
  const editor = useEditor(editorDefinition);

  // sets the initial theme when the component mounts
  useEffect(() => {
    notebookEditorTheme.setThemeStylesheet()/*sync stylesheet*/;
  }, []);

  return <NotebookContext.Provider value={{ editor }}>{children}</NotebookContext.Provider>;
};

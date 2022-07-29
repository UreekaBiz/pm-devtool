import { useEditor } from '@tiptap/react';
import { useEffect } from 'react';

import { notebookEditorTheme } from 'notebookEditor/extension/theme/theme';
import { editorDefinition } from 'notebookEditor/type';

import { NotebookEditorContext } from './NotebookEditorContext';

// ********************************************************************************
interface Props { children: React.ReactNode; }
export const NotebookEditorProvider: React.FC<Props> = ({ children }) => {
  const editor = useEditor(editorDefinition);

  // sets the initial theme when the component mounts
  useEffect(() => {
    notebookEditorTheme.setThemeStylesheet()/*sync stylesheet*/;
  }, []);

  return <NotebookEditorContext.Provider value={{ editor }}>{children}</NotebookEditorContext.Provider>;
};

import { useEditor } from '@tiptap/react';
import { useEffect } from 'react';

import { setThemeStylesheet } from 'notebookEditor/theme/theme';
import { editorDefinition } from 'notebookEditor/type';

import { NotebookEditorContext } from './NotebookEditorContext';

// ********************************************************************************
interface Props { children: React.ReactNode; }
export const NotebookEditorProvider: React.FC<Props> = ({ children }) => {
  const editor = useEditor(editorDefinition);

  // sets the initial Theme when the component mounts
  useEffect(() => {
    setThemeStylesheet()/*sync stylesheet*/;
  }, [/*only on mount/unmount*/]);

  return <NotebookEditorContext.Provider value={{ editor }}>{children}</NotebookEditorContext.Provider>;
};

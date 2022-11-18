import { useEffect } from 'react';

import { setThemeStylesheet } from 'notebookEditor/theme';
import { editorDefinition } from 'notebookEditor/editor/type';
import { useEditor } from 'notebookEditor/hook/useEditor';

import { EditorContext } from './EditorContext';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const EditorProvider: React.FC<Props> = ({ children }) => {
  const editor = useEditor(editorDefinition);

  // sets the initial Theme when the component mounts
  useEffect(() => {
    setThemeStylesheet()/*sync stylesheet*/;
  }, [/*only on mount/unmount*/]);

  return <EditorContext.Provider value={{ editor }}>{children}</EditorContext.Provider>;
};

import { useEffect, useMemo, useState } from 'react';

import { editorDefinition, Editor } from 'notebookEditor/editor';
import { setThemeStylesheet } from 'notebookEditor/theme';

import { EditorContext } from './EditorContext';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const EditorProvider: React.FC<Props> = ({ children }) => {
  const editor = useMemo(() => new Editor(editorDefinition), [/*no deps*/]);

  // -- State ---------------------------------------------------------------------
  const [/*state can be accessed through Editor object*/, setViewState] = useState(editor.view.state);

  useEffect(() => {
    editor.setReactUpdateCallback(setViewState);
  }, [editor]);

  // sets the initial Theme when the component mounts
  useEffect(() => {
    setThemeStylesheet()/*sync stylesheet*/;
  }, [/*only on mount/unmount*/]);

  return <EditorContext.Provider value={{ editor }}>{children}</EditorContext.Provider>;
};

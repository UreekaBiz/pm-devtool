import { getSchema, NotebookSchemaVersion } from 'common';

import { Editor } from 'notebookEditor/API';

import { EditorContext } from './EditorContext';

// ********************************************************************************
// == Interface ===================================================================
interface Props { children: React.ReactNode; }

// == Component ===================================================================
export const EditorProvider: React.FC<Props> = ({ children }) => {
  const editor = new Editor(getSchema(NotebookSchemaVersion.V1));

  // TODO: add back
  // sets the initial Theme when the component mounts
  // useEffect(() => {
  //   setThemeStylesheet()/*sync stylesheet*/;
  // }, [/*only on mount/unmount*/]);

  return <EditorContext.Provider value={{ editor }}>{children}</EditorContext.Provider>;
};

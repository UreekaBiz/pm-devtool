import { useContext } from 'react';

import { EditorContext } from 'notebookEditor/context';

// ********************************************************************************
// == Component ===================================================================
export const useEditor = () => {
  const context = useContext(EditorContext);
  if(!context) throw new Error('useNotebookAPI hook must be used within a NotebookContext');

  return context;
};

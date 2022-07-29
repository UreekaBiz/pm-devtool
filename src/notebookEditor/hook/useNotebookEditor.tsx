import { useContext } from 'react';

import { NotebookEditorContext } from 'notebookEditor/context/NotebookEditorContext';

// ********************************************************************************
export const useNotebookEditor = () => {
  const context = useContext(NotebookEditorContext);
  if(!context) throw new Error('useNotebookEditor hook must be used within a NotebookContext');

  return context;
};

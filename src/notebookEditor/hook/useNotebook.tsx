import { useContext } from 'react';

import { NotebookContext } from 'notebookEditor/context/NotebookContext';

// ********************************************************************************
/**
 * Enables React components to make use of the NotebookContext to access the
 * NotebookEditor
 */
export const useNotebook = () => {
  const context = useContext(NotebookContext);
  if(!context) throw new Error('useNotebook hook must be used within a NotebookContext');

  return context;
};

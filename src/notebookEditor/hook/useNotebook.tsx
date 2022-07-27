import { useContext } from 'react';

import { NotebookContext } from 'notebookEditor/context/NotebookContext';

// ********************************************************************************
export const useNotebook = () => {
  const context = useContext(NotebookContext);
  if(!context) throw new Error('useNotebook hook must be used within a NotebookContext');

  return context;
};

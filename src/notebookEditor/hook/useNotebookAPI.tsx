import { useContext } from 'react';

import { NotebookAPIContext } from 'notebookEditor/context/NotebookAPIContext';

// ********************************************************************************
// == Component ===================================================================
export const useNotebookAPI = () => {
  const context = useContext(NotebookAPIContext);
  if(!context) throw new Error('useNotebookAPI hook must be used within a NotebookContext');

  return context;
};

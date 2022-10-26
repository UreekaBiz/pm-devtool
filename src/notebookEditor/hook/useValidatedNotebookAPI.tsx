import { NotebookAPI } from 'notebookEditor/API';

import { useNotebookAPI } from './useNotebookAPI';

// ********************************************************************************
// ensures that all React children that use this hook have access to a defined NotebookAPI
export const useValidatedNotebookAPI = (): NotebookAPI => {
  const { notebookAPI } = useNotebookAPI();
  if(!notebookAPI) throw new Error('useValidatedNotebookAPI must be used inside notebookAPIValidator');

  return notebookAPI;
};

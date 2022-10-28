import { Editor } from 'notebookEditor/editor';

import { useEditor } from './useEditor';

// ********************************************************************************
// ensures that all React children that use this hook have access to a defined NotebookAPI
export const useValidatedEditor = (): Editor => {
  const { editor } = useEditor();
  if(!editor) throw new Error('useValidatedNotebookAPI must be used inside notebookAPIValidator');

  return editor;
};

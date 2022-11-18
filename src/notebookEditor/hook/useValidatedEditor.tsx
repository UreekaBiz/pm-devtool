import { Editor } from 'notebookEditor/editor/Editor';

import { useEditorContext } from 'notebookEditor/editor/component/useEditorContext';

// ********************************************************************************
// ensures that all React children that use this hook have access to a defined NotebookAPI
export const useValidatedEditor = (): Editor => {
  const { editor } = useEditorContext();
  if(!editor) throw new Error('useValidatedNotebookAPI must be used inside notebookAPIValidator');

  return editor;
};

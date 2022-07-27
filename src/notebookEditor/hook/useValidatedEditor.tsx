import { Editor } from '@tiptap/react';

import { useNotebook } from './useNotebook';

// ********************************************************************************
// ensures that all React children that use this hook have access to a defined Editor
export const useValidatedEditor = (): Editor => {
  const { editor } = useNotebook();
  if(!editor) throw new Error('useValidatedEditor must be used inside EditorValidator');

  return editor;
};

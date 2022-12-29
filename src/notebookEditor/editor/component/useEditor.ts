import { useEffect, useState, DependencyList } from 'react';

import { Extension } from 'notebookEditor/extension/type/Extension/Extension';

import { Editor } from '../Editor';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/react/src/useEditor.ts

// == Component ===================================================================
export const useEditor = (extensions: Extension[], deps: DependencyList = [/*none*/]) => {
  // -- State ---------------------------------------------------------------------
  const [editor, setEditor] = useState<Editor | null>(null/*default none*/);
  const forceUpdate = useForceUpdate();

  // -- Effect --------------------------------------------------------------------
  useEffect(() => {
    const updateReactEditorCallback = () => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
          if(isMounted) {
            forceUpdate();
          } /* else -- not mounted */
      }));
    };

    let isMounted = true;
    const newEditorInstance = new Editor(extensions, updateReactEditorCallback);
    setEditor(newEditorInstance);

    return () => { newEditorInstance.destroy(); isMounted = false; };
  }, deps);

  // ------------------------------------------------------------------------------
  return editor;
};

// == Hook ========================================================================
// NOTE: this is required to ensure the Editor
//       changes correctly once it is initialized.
const useForceUpdate = () =>  {
  // -- State ---------------------------------------------------------------------
  const [, setValue] = useState(0/*default*/);

  return () => setValue((value) => value + 1/*force a re-render*/);
};



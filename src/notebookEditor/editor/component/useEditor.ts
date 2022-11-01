import { useEffect, useState } from 'react';

import { Extension } from 'notebookEditor/extension';

import { Editor } from '../Editor';

// ********************************************************************************
// == Component ===================================================================
export const useEditor = (extensions: Extension[]) => {
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
  }, [extensions, forceUpdate]);

  // ------------------------------------------------------------------------------
  return editor;
};

// == Hook ========================================================================
const useForceUpdate = () =>  {
  // -- State ---------------------------------------------------------------------
  const [, setValue] = useState(0/*default*/);

  return () => setValue(value => value + 1/*T&E*/);
};



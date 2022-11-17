import { useEffect, useState, DependencyList } from 'react';

import { Extension } from 'notebookEditor/extension';

import { Editor } from '../Editor';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/UreekaBiz/pm-devtool/blob/framework-full/src/notebookEditor/editor/component/useEditor.ts

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
const useForceUpdate = () =>  {
  // -- State ---------------------------------------------------------------------
  const [, setValue] = useState(0/*default*/);

  return () => setValue(value => value + 1/*T&E*/);
};



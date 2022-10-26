import { useEffect, useRef } from 'react';

import { useValidatedNotebookAPI } from 'notebookEditor/hook/';

// ********************************************************************************
// == Interface ===================================================================
interface Props {/*currently nothing*/}

// == Component ===================================================================
export const Editor: React.FC<Props> = () => {
  const editorContainer = useRef<HTMLDivElement>(null/*default*/);
  const notebookAPI = useValidatedNotebookAPI();

  // -- Effect --------------------------------------------------------------------
  useEffect(() => {
    if(!editorContainer.current) return/*not mounted yet*/;
    if(notebookAPI.view) return/*already mounted*/;

    notebookAPI.mountView(editorContainer.current);
  }, [notebookAPI]);

  // -- UI ------------------------------------------------------------------------
  return <div ref={editorContainer} />;
};

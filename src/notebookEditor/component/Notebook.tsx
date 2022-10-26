import { Box } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';

import { setTextSelectionCommand } from 'common';

import { useValidatedNotebookAPI } from 'notebookEditor/hook/';

// ********************************************************************************
// == Constant ====================================================================
export const EDITOR_CONTAINER_ID = 'NotebookEditorContainerID';

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

  // -- Handler -------------------------------------------------------------------
  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // NOTE: since this Event Handler runs before other view element event
    //       handlers (e.g. TaskListItem checkboxes), ensure that it is a Div that
    //       is being clicked so that the Selection is not being modified
    //       incorrectly. More checks might have to be added in the future
    if(!(event.target instanceof HTMLDivElement)) return/*(SEE: NOTE above)*/;
    if(!notebookAPI.view) return/*not initialized yet*/;

    const focusPos = notebookAPI.view.state.doc.nodeSize - 2/*account for start and end of Doc*/;
    setTextSelectionCommand({ from: focusPos, to: focusPos })(notebookAPI.view.state, notebookAPI.view?.dispatch);
    notebookAPI.view?.focus();
  };

  // -- UI ------------------------------------------------------------------------
  return (<Box id={EDITOR_CONTAINER_ID} ref={editorContainer} height='full' overflowY='auto' onClick={handleClick} />);
};

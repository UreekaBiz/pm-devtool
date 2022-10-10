import { Box } from '@chakra-ui/react';
import { EditorContent } from '@tiptap/react';
import { useEffect, useState } from 'react';

import { setTextSelectionCommand } from 'common';

import { useNotebookEditor } from 'notebookEditor/hook/useNotebookEditor';

import { EditorUserInteractions } from './EditorUserInteractions';

// ********************************************************************************
export const EDITOR_CONTAINER_ID = 'NotebookEditorContainerID';
const EDITOR_ACTIONABLE_CLASS = 'Editor-actionable';

export const Editor: React.FC = () => {
  const { editor } = useNotebookEditor();

  // == State =====================================================================
  const [isActionModifierPressed, setIsActionModifierPressed] = useState(false/*by contract*/);

  // == Effect ====================================================================
  // add the actionable class to the Editor if the CMD or the CTRL keys are
  // pressed, which will make actionable nodes have special styles (SEE: index.css)
  useEffect(() => {
    const setActionableClass = (event: KeyboardEvent) => {
      if(event.ctrlKey || event.metaKey) {
        setIsActionModifierPressed(true);
      } /* else -- do not set to true */
    };
    const unsetActionableClass = (event: KeyboardEvent) => {
      if(!(event.ctrlKey) && !(event.metaKey)) {
        setIsActionModifierPressed(false);
      } /* else -- do not set to false */
    };

    window.addEventListener('keydown', setActionableClass);
    window.addEventListener('keyup', unsetActionableClass);

    return () => {
      window.removeEventListener('keydown', unsetActionableClass);
      window.removeEventListener('keyup', unsetActionableClass);
    };
  }, []);

  // == Handler ===================================================================
  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // NOTE: since this Event Handler runs before other view element event
    //       handlers (e.g. TaskListItem checkboxes), ensure that it is a Div that
    //       is being clicked so that the Selection is not being modified
    //       incorrectly. More checks might have to be added in the future
    if(!(event.target instanceof HTMLDivElement)) return/*(SEE: NOTE above)*/;

    if(!editor) return/*nothing to do*/;
    if(editor.isFocused) return/*already focused*/;

    const focusPos = editor.state.doc.nodeSize - 2/*account for start and end of Doc*/;
    setTextSelectionCommand({ from: focusPos, to: focusPos })(editor.state, editor.view.dispatch);
    editor.view.focus();
  };

  // == UI ========================================================================
  return (
    <Box id={EDITOR_CONTAINER_ID} className={isActionModifierPressed ? EDITOR_ACTIONABLE_CLASS : ''} height='full' overflowY='auto' onClick={(event) => handleClick(event)}>
      <EditorUserInteractions />
      <EditorContent editor={editor} />
    </Box>
  );
};

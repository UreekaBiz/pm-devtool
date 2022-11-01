import { Box } from '@chakra-ui/react';

import { setTextSelectionCommand } from 'common';

import { EditorContent } from 'notebookEditor/editor/component';
import { useValidatedEditor } from 'notebookEditor/hook';

// ********************************************************************************
// == Constant ====================================================================
export const EDITOR_CONTAINER_ID = 'NotebookEditorContainerID';

// == Interface ===================================================================
interface Props {/*currently nothing*/ }

// == Component ===================================================================
export const Editor: React.FC<Props> = () => {
  const editor = useValidatedEditor();

  // -- Handler -------------------------------------------------------------------
  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // NOTE: since this Event Handler runs before other view element event
    //       handlers (e.g. TaskListItem checkboxes), ensure that it is a Div that
    //       is being clicked so that the Selection is not being modified
    //       incorrectly. More checks might have to be added in the future
    if(!(event.target instanceof HTMLDivElement)) return/*(SEE: NOTE above)*/;
    if(editor.view.hasFocus()) return/*already focused*/;

    editor.executeCommand(setTextSelectionCommand({ from: editor.endOfDocPos, to: editor.endOfDocPos }));
    editor.focusView();
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <Box id={EDITOR_CONTAINER_ID} height='full' overflowY='auto' onClick={(event) => handleClick(event)}>
      <EditorContent editor={editor} />
    </Box>
  );
};

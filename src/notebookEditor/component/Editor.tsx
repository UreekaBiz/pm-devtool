import { Box } from '@chakra-ui/react';
import { EditorContent } from '@tiptap/react';

import { useNotebook } from 'notebookEditor/hook/useNotebook';

import { EditorUserInteractions } from './EditorUserInteractions';

// ********************************************************************************
export const EDITOR_CONTAINER_ID = 'NotebookEditorContainerID';

export const Editor: React.FC = () => {
  const { editor } = useNotebook();

  // == Handlers ==================================================================
  const handleClick = () => {
    if(!editor) return/*nothing to do*/;
    if(editor.isFocused) return/*already focused*/;

    editor.commands.focus(editor.state.selection.$anchor.pos);
  };

  // == UI ========================================================================
  return (
    <Box id={EDITOR_CONTAINER_ID} height='full' overflowY='auto' onClick={handleClick}>
      <EditorUserInteractions />
      <EditorContent editor={editor} />
    </Box>
  );
};

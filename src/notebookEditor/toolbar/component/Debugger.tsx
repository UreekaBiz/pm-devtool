import { Box, Divider, Text } from '@chakra-ui/react';

import { Editor } from 'notebookEditor/editor/Editor';
import { useValidatedEditor } from 'notebookEditor/hook/useValidatedEditor';

// ********************************************************************************
// == Component ===================================================================
export const Debugger = () => {
  const editor = useValidatedEditor();

  // -- UI ------------------------------------------------------------------------
  return (
    <>
      <Divider />
      <Box paddingX={2} overflow='auto'>
        <Text marginBottom={1} paddingTop={2} fontSize={15} fontWeight='bold' textTransform='capitalize'>
          Selection
        </Text>
        <Box overflow='auto' fontSize={12}>
          <pre>{JSON.stringify(editor.view.state.selection, null/*no replacer*/, 2)}</pre>
        </Box>
      </Box>

      {editor.view.state.storedMarks && (
        <>
          <Divider />
          <Box paddingX={2} overflow='auto'>
            <Text marginBottom={1} paddingTop={2} fontSize={15} fontWeight='bold' textTransform='capitalize'>
              Stored Marks
            </Text>
            <Box overflow='auto' fontSize={12}>
              <pre>{JSON.stringify(editor.view.state.storedMarks, null/*no replacer*/, 2)}</pre>
            </Box>
          </Box>
        </>
      )}

      <Divider />
      <Box flex='1 1 0' paddingX={2} overflow='auto'>
        <Text marginBottom={1} paddingTop={2} fontSize={15} fontWeight='bold' textTransform='capitalize'>
          Document
        </Text>
        <Box overflow='auto' fontSize={12}>
          <pre>{stringifyDocWithPositions(editor)}</pre>
        </Box>
      </Box>
    </>
  );
};

// == Util ========================================================================
const stringifyDocWithPositions = (editor: Editor) => {
  const doc = editor.view.state.doc;

  doc.descendants((node, pos) => {
    // NOTE: since this is only used for debugging purposes and is not actually
    //       in the real Document, add the startPos and index of each Node
    //       to its stringified representation, for debugging purposes
    // @ts-ignore
    node.attrs['startPos'] = pos;

    // @ts-ignore
    node.attrs['index()'] = doc.resolve(pos).index();
  });
  return JSON.stringify(doc, null/*no replacer*/, 2/*T&E indentation*/);
};

import { Box, Divider, Text } from '@chakra-ui/react';

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
          <pre>{JSON.stringify(editor.view.state.doc, null/*no replacer*/, 2/*T&E indentation*/)}</pre>
        </Box>
      </Box>
    </>
  );
};

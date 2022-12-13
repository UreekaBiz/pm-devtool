import { useToast, Button, Box, Tooltip } from '@chakra-ui/react';

import { isCodeBlockNode, AncestorDepth } from 'common';

import { toolItemCommandWrapper } from 'notebookEditor/command/util';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

import { formatCodeBlockCommand } from '../command';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }

// == Component ===================================================================
// NOTE: currently in a ToolItem to give feedback to user through Tooltip
export const CodeBlockFormatToolItem: React.FC<Props> = ({ editor, depth }) => {
  const toast = useToast();

  const { $from } = editor.view.state.selection;
  const codeBlock = $from.node(AncestorDepth.GrandParent);
  if(!isCodeBlockNode(codeBlock)) throw new Error('Invalid CodeBlock WrapTool Render');

  // -- Handler -------------------------------------------------------------------
  const handleFormat = () => {
    try {
      toolItemCommandWrapper(editor, depth, formatCodeBlockCommand);
    } catch(error) {
      toast({ title: (error as SyntaxError/*by contract*/).message, status: 'error', duration: 8000/*ms, T&E*/ });
    }
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <Tooltip label='Format CodeBlock Content'>
      <Box padding='20px' >
        <Button
          onClick={() => handleFormat()}
          size='sm'
          width='100%'
          colorScheme='blue'
        >
          Format
        </Button>
      </Box>
    </Tooltip>
  );
};


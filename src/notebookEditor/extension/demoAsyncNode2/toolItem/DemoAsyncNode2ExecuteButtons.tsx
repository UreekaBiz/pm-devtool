import { useToast, Box, Flex, IconButton, Tooltip, Spinner } from '@chakra-ui/react';
import { useEffect } from 'react';
import { FiPlay } from 'react-icons/fi';

import { getSelectedNode, isDemoAsyncNode2, AttributeType, NodeName } from 'common';

import { getNodeViewStorage } from 'notebookEditor/model/NodeViewStorage';
import { useIsMounted } from 'notebookEditor/shared/hook/useIsMounted';
import { EditorToolComponentProps, TOOL_ITEM_DATA_TYPE } from 'notebookEditor/toolbar/type';

import { DemoAsyncNode2Controller, DemoAsyncNode2StorageType } from '../nodeView/controller';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }

// == Component ===================================================================
export const DemoAsyncNode2ExecuteButtons: React.FC<Props> = ({ editor, depth }) => {
  const isMounted = useIsMounted();
  const toast = useToast();

  const node = getSelectedNode(editor.view.state, depth);
  if(!node || !isDemoAsyncNode2(node)) return null/*nothing to render -- silently fail*/;
  const id = node.attrs[AttributeType.Id];
  if(!id) return null/*nothing to render -- silently fail*/;

  const DemoAsyncNode2ViewStorage = getNodeViewStorage<DemoAsyncNode2StorageType>(editor, NodeName.DEMO_ASYNC_NODE_2),
        DemoAsyncNode2View = DemoAsyncNode2ViewStorage.getNodeView(id);
  if(!DemoAsyncNode2View) return null/*nothing to render -- silently fail*/;

  const { textContent } = DemoAsyncNode2View.node;
  const { textToReplace } = DemoAsyncNode2View.node.attrs;

  const isLoading = DemoAsyncNode2View.nodeModel.getPerformingAsyncOperation();
  const disabled = !(textToReplace && textToReplace.length > 0)
                || !(textContent.includes(textToReplace))
                || (textContent.length < 1)
                || isLoading;

  // == Handler ===================================================================
  // executes the remote async call in the DemoAsyncNode2 NodeView
  const handleRemoteClick = async () => {
    if(isLoading) return/*nothing to do*/;
    editor.view.focus();

    try {
      await DemoAsyncNode2View.executeAsyncCall();
    } catch(error) {
      console.error(`Error ocurred while executing Demo 2 Async Node (${id})`, error);
      if(!isMounted()) return/*nothing to do*/;
      toast({
        title:' Error ocurred while executing Demo 2 Async Node',
        status: 'error',
      });
    } finally {
      if(!isMounted()) return/*nothing to do*/;
    }
  };

  // executes the local async call in the DemoAsyncNode NodeView
  const handleLocalClick = async () => {
    if(isLoading) return/*nothing to do*/;
    editor.view.focus();

    try {
      await DemoAsyncNode2View.executeAsyncCall();
    } catch(error) {
      console.error(`Error ocurred while executing Demo 2 Async Node (${id})`, error);
      if(!isMounted()) return/*nothing to do*/;
      toast({
        title: ' Error ocurred while executing Demo2 Async Node',
        status: 'error',
      });
    } finally {
      if(!isMounted()) return/*nothing to do*/;
    }
  };

  // == UI ========================================================================
  return (
    <Flex>
      <ExecuteShortcut DemoAsyncNode2View={DemoAsyncNode2View} disabled={disabled} />
      <Box marginRight={1} >
        <Tooltip label={disabled ? ''/*none*/ : 'Execute Remotely'} hasArrow>
          <IconButton
            isDisabled={disabled}
            icon={isLoading ? <Spinner size='sm' /> : <FiPlay color='blue' fill='blue' size='16px' />}
            size='xs'
            variant='ghost'
            marginY='5px'
            marginLeft='10px'
            aria-label='execute'
            datatype={disabled ? ''/*none*/ : TOOL_ITEM_DATA_TYPE/*(SEE:notebookEditor/toolbar/type)*/}
            rounded={100}
            onClick={handleRemoteClick}
          />
        </Tooltip>
        <Tooltip label={disabled ? ''/*none*/ : 'Execute Locally'} hasArrow>
          <IconButton
            isDisabled={disabled}
            icon={isLoading ? <Spinner size='sm' /> : <FiPlay size='16px' />}
            size='xs'
            variant='ghost'
            marginY='5px'
            marginLeft='10px'
            aria-label='execute'
            datatype={disabled ? ''/*none*/ : TOOL_ITEM_DATA_TYPE/*(SEE:notebookEditor/toolbar/type)*/}
            rounded={100}
            onClick={handleLocalClick}
          />
        </Tooltip>
      </Box>
    </Flex>
  );
};

// ================================================================================
type ExecuteShortcutProps = {
  DemoAsyncNode2View: DemoAsyncNode2Controller;
  disabled: boolean;
}
const ExecuteShortcut: React.FC<ExecuteShortcutProps> = ({ DemoAsyncNode2View, disabled }) => {
  // == Effect ====================================================================
  // executed the DAN when the user presses CMD + Enter
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if(disabled) return/*execution not allowed, nothing to do*/;
      if(DemoAsyncNode2View.nodeModel.getPerformingAsyncOperation()) return/*don't execute if already loading*/;
      if(event.key !== 'Enter' || !event.metaKey) return/*nothing to do*/;

      DemoAsyncNode2View.executeAsyncCall();
    };

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); };
  }, [DemoAsyncNode2View, disabled]);

  return null/*do not display anything, just add Effect*/;
};

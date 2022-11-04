import { useToast, Box, Flex, IconButton, Tooltip, Spinner } from '@chakra-ui/react';
import { FiPlay } from 'react-icons/fi';
import { useEffect } from 'react';

import { getSelectedNode, isDemoAsyncNode, AttributeType, NodeName, REMOVED_CODEBLOCK_VISUALID } from 'common';

import { areCodeBlocksEmpty } from 'notebookEditor/extension/asyncNode/util';
import { visualIdFromCodeBlockReference } from 'notebookEditor/extension/codeblock/util';
import { useIsMounted } from 'notebookEditor/shared/hook/useIsMounted';
import { getNodeViewStorage } from 'notebookEditor/model/NodeViewStorage';
import { EditorToolComponentProps, TOOL_ITEM_DATA_TYPE } from 'notebookEditor/toolbar/type';

import { DemoAsyncNodeController, DemoAsyncNodeStorageType } from '../nodeView/controller';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }

// == Component ===================================================================
export const ExecuteButtons: React.FC<Props> = ({ editor, depth }) => {
  const isMounted = useIsMounted();
  const toast = useToast();

  const node = getSelectedNode(editor.view.state, depth);
  if(!node || !isDemoAsyncNode(node)) return null/*nothing to render -- silently fail*/;
  const { attrs } = node;

  const id = attrs[AttributeType.Id],
    codeBlockReferences = attrs[AttributeType.CodeBlockReferences] ?? []/*default*/;
  if(!id) return null/*nothing to render -- silently fail*/;

  const demoAsyncNodeViewStorage = getNodeViewStorage<DemoAsyncNodeStorageType>(editor, NodeName.DEMO_ASYNC_NODE),
    demoAsyncNodeView = demoAsyncNodeViewStorage.getNodeView(id);
  if(!demoAsyncNodeView) return null/*nothing to render -- silently fail*/;

  const isLoading = demoAsyncNodeView.nodeModel.getPerformingAsyncOperation();

  const disabled = codeBlockReferences.length < 1 ||
                areCodeBlocksEmpty(editor, codeBlockReferences) ||
                codeBlockReferences.some((reference) => visualIdFromCodeBlockReference(editor, reference) === REMOVED_CODEBLOCK_VISUALID) ||
                isLoading;


  // -- Handler -------------------------------------------------------------------
  // executes the remote async call in the DemoAsyncNode node view
  const handleRemoteClick = async () => {
    if(isLoading) return/*nothing to do*/;
    editor.view.focus();

    try {
      await demoAsyncNodeView.executeAsyncCall();
    } catch(error) {
      console.error(`Error ocurred while executing Demo Async Node (${id})`, error);
      if(!isMounted()) return/*nothing to do*/;
      toast({
        title: ' Error ocurred while executing Demo Async Node',
        status: 'error',
      });
    } finally {
      if(!isMounted()) return/*nothing to do*/;
    }
  };

  // executes the local async call in the DemoAsyncNode node view
  const handleLocalClick = async () => {
    if(isLoading) return/*nothing to do*/;
    editor.view.focus();

    try {
      await demoAsyncNodeView.executeAsyncCall();
    } catch(error) {
      console.error(`Error ocurred while executing Demo Async Node (${id})`, error);
      if(!isMounted()) return/*nothing to do*/;
      toast({
        title: ' Error ocurred while executing Demo Async Node',
        status: 'error',
      });
    } finally {
      if(!isMounted()) return/*nothing to do*/;
    }
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <Flex>
      <ExecuteShortcut demoAsyncNodeView={demoAsyncNodeView} disabled={disabled} />
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
type ExecuteShortcutProps = { demoAsyncNodeView: DemoAsyncNodeController; disabled: boolean; }
const ExecuteShortcut: React.FC<ExecuteShortcutProps> = ({ demoAsyncNodeView, disabled }) => {
  // == Effect ====================================================================
  // executed the DAN when the user presses CMD + Enter
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if(disabled) return/*execution not allowed, nothing to do*/;
      if(demoAsyncNodeView.nodeModel.getPerformingAsyncOperation()) return/*don't execute if already loading*/;
      if(event.key !== 'Enter' || !event.metaKey) return/*nothing to do*/;

      demoAsyncNodeView.executeAsyncCall();
    };

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); };
  }, [demoAsyncNodeView, disabled]);

  return null/*do not display anything, just add Effect*/;
};

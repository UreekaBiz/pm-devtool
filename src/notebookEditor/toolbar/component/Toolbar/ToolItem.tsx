import { useToast, Center, Tooltip } from '@chakra-ui/react';
import { useCallback } from 'react';

import { isMarkActive, isMarkName, isNodeActive, isNodeName, SelectionDepth } from 'common';

import ErrorBoundary from 'core/component/ErrorBoundary';
import { Editor } from 'notebookEditor/editor/Editor';
import { ACTIVE_BUTTON_COLOR, ICON_BUTTON_CLASS } from 'notebookEditor/theme/theme';
import { ToolItem, TOOL_ITEM_DATA_TYPE } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props {
  editor: Editor;
  tool: ToolItem;

  depth: SelectionDepth;
}
// == Component ===================================================================
// NOTE: this component is not meant to be used directly, it is meant to be used
//       inside a ErrorBoundary component. (See below)
const InternalToolItem: React.FC<Props> = ({ editor, tool, depth }) => {
  const isButtonActive = isToolActive(editor, tool);
  const toast = useToast();

  // -- Handler -------------------------------------------------------------------
  const handleToolClick = useCallback(() => {
    if(tool.toolType !== 'button') return/*nothing to do*/;

    // prevent application from breaking in case of an error in the ToolItem.
    try {
      tool.onClick(editor, depth);
    } catch(error) {
      console.error(`Error while executing the tool ${tool.label}. Reason: `, error);
      const message =  error instanceof Error ? error.message : `Unknown error.`;
      toast({
        title: `Error while executing the tool ${tool.label}`,
        description: message,
        status: 'error',
        duration: 3000/*ms*/,
        isClosable: true,
      });
    }
  }, [editor, depth, toast, tool]);

  // -- UI ------------------------------------------------------------------------
  if(tool.shouldShow && !tool.shouldShow(editor, depth)) return null/*nothing to render*/;
  if(tool.toolType === 'component') return <>{tool.component({ editor, depth })/*use tool component implementation*/}</>;
  return (
    <Tooltip hasArrow label={tool.tooltip} size='md'>
      <button
        id={tool.name}
        data-type={TOOL_ITEM_DATA_TYPE/*(SEE: notebookEditor/toolbar/type )*/}
        key={tool.name}
        className={ICON_BUTTON_CLASS}
        disabled={tool.shouldBeDisabled && tool.shouldBeDisabled(editor)}
        style={{ background: isButtonActive ? ACTIVE_BUTTON_COLOR : undefined/*default*/, color: tool.shouldBeDisabled && tool.shouldBeDisabled(editor) ? 'slategray' : 'black' }}
        onClick={handleToolClick}
      >
        <Center>
          {tool.icon}
        </Center>
      </button>
    </Tooltip>
  );
};

// wraps the InternalToolItem component in a ErrorBoundary component to prevent
// errors on the Item to bubble out and break the application
// NOTE: suffix "Component" is used to avoid conflict with ToolItem type
export const ToolItemComponent: React.FC<Props> = (props) => {
  // component to display when an error occurs on the InternalToolItem. Currently,
  // nothing is rendered when there is an error by contract since it is required
  // that the User's experience is never interrupted
  const ErrorComponent = null/*don't render anything*/;
  return <ErrorBoundary errorComponent={ErrorComponent}><InternalToolItem {...props} /></ErrorBoundary>;
};

// == Util ========================================================================
const isToolActive = (editor: Editor, tool: ToolItem) => {
  // NOTE: This is a special case since Heading node uses multiple Tool Items for
  //       the same kind of node only differentiated by the Level attribute.
  if(tool.toolType === 'component') return false/*no active state for components*/;

  // Use component implementation if defined
  if(tool.isActive) return tool.isActive(editor);

  if(isNodeName(tool.name)) {
    return isNodeActive(editor.view.state, tool.name);
  } else if(isMarkName(tool.name)) {
    return isMarkActive(editor.view.state, tool.name);
  } else {
    return false/*default*/;
  }
};

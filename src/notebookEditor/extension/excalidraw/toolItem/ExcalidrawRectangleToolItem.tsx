import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { Box, Tooltip, Button } from '@chakra-ui/react';
import { useCallback } from 'react';

import { customNanoid, isExcalidrawNode, AttributeType, isNodeSelection } from 'common';

import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }

// == Component ===================================================================
// NOTE: currently in a ToolItem to give feedback to user through Tooltip
export const ExcalidrawRectangleToolItem: React.FC<Props> = ({ editor }) => {
  const { selection } = editor.view.state;
  const { $from } = selection;
  if(!isNodeSelection(selection) || !isExcalidrawNode(selection.node)) throw new Error('Invalid ExcalidrawRectangleToolItem Render');

  const { node: excalidraw } = selection;

  // -- Handler -------------------------------------------------------------------
  // TODO: move into command
  const addExcalidrawRectangle = useCallback(() => {
    const elements = excalidraw.attrs[AttributeType.ExcalidrawElements];
    if(!elements) return/*nothing to do*/;

    const currentElements: ExcalidrawElement[] = JSON.parse(elements) as ExcalidrawElement[];
    editor.view.dispatch(editor.view.state.tr.setNodeMarkup($from.pos, undefined/*maintain type*/, { ...excalidraw.attrs, [AttributeType.ExcalidrawElements]: JSON.stringify([...currentElements, createExcalidrawRect()]) }));
  }, [$from.pos, editor.view, excalidraw.attrs]);

  // -- UI ------------------------------------------------------------------------
  return (
    <Tooltip label='Add Rectangle'>
      <Box padding='20px' >
        <Button
          onClick={() => addExcalidrawRectangle()}
          size='sm'
          width='100%'
          colorScheme='blue'
        >
          Add Rectangle
        </Button>
      </Box>
    </Tooltip>
  );
};

// == Util ========================================================================
// TODO: move somewhere else
const createExcalidrawRect = () => (
  {
    id: customNanoid(),
    type: 'rectangle',
    version: 141,
    versionNonce: 361174001,
    isDeleted: false,
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: 100,
    y: 93,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    width: 186,
    height: 141,
    seed: 1968410350,
    groupIds: [],
  }
);

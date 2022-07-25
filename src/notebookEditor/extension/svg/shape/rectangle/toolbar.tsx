import { Flex, Text } from '@chakra-ui/react';
import { BsLayerBackward, BsLayerForward } from 'react-icons/bs';
import { CgArrangeBack, CgArrangeFront } from 'react-icons/cg';

import { isRectangleAttributes, NodeName, RECTANGLE_INFO_TOOL_UI, RECTANGLE_ORDER_TOOL_UI } from 'common';

import { isNodeSelection, selectionIsOfType } from 'notebookEditor/extension/util/node';
import { Toolbar } from 'notebookEditor/toolbar/type';

import { IndexChange } from '../../command';
import { computeRectFromCenterDimension } from '../../util/math';
import { ShapeToolContainerUI } from '../toolbar/ShapeToolContainerUI';

//*********************************************************************************
export const RectangleToolbar: Toolbar = {
  nodeName: NodeName.RECTANGLE,
  toolsCollections: [ [
    // == Properties ==========================================================
    {
      toolType: 'component',
      name: RECTANGLE_INFO_TOOL_UI,

      component: ({ editor }) => {
        const { selection } = editor.state;
        if(!isNodeSelection(selection)) throw new Error('Invalid Rectangle Center Tool render');
        const { attrs } = selection.node;
        if(!isRectangleAttributes(attrs)) throw new Error('Invalid Rectangle Attributes for Rectangle Center Tool');

        const { centerX, centerY, width, height } = attrs;
        const { topLeft } = computeRectFromCenterDimension({ x: centerX, y: centerY }, { width, height });

        return (
          <Flex flexDir={'column'} width={'100%'}>
            <Text fontSize={'12px'}>{`ID: ${attrs.id}`}</Text>
            <Text fontSize={'12px'}>{`Center: ${attrs.centerX}, ${attrs.centerY}`}</Text>
            <Text fontSize={'12px'}>{`TopLeft: ${topLeft.x}, ${topLeft.y}`}</Text>
            <Text fontSize={'12px'}>{`Width: ${attrs.width}`}</Text>
            <Text fontSize={'12px'}>{`Height: ${attrs.height}`}</Text>
          </Flex>
        );
      },
      shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
      shouldBeDisabled: () => false,
    },

    // == Order ===========================================================
    {
      toolType: 'component',
      name: RECTANGLE_ORDER_TOOL_UI,

      component: ({ editor }) =>
        <ShapeToolContainerUI
          toolTitle={'Layers'}
          buttonLabels={['Send to Back', 'Send Backward', 'Bring to Front', 'Bring Forward']}
          callback={(indexChange) => editor.chain().focus().updateShapeOrder(Number(indexChange), isRectangleAttributes).run() }
          callbackArguments={[IndexChange.Bottom, IndexChange.Decrease, IndexChange.Top, IndexChange.Increase]}
          buttonIcons={[<CgArrangeBack key={'sendToBack'} />, <BsLayerBackward key={'sendBackward'} />, <CgArrangeFront key={'bringToFront'} />, <BsLayerForward key={'bringForward'} /> ]}
        />,

      shouldShow: (editor) => selectionIsOfType(editor.state.selection, NodeName.RECTANGLE),
      shouldBeDisabled: () => false,
    },
  ],
  ],
};


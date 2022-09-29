import { Box } from '@chakra-ui/react';

import { isImageNode, isNodeSelection, AttributeType } from 'common';
import { DropdownTool } from 'notebookEditor/extension/shared/component/DropdownToolItem/DropdownTool';

import { ColorPicker } from 'notebookEditor/extension/style/component/ColorPicker';
import { textColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
interface Props extends EditorToolComponentProps {/*no additional*/ }
export const ImageBorderToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { selection } = editor.state;
  if(!isNodeSelection(selection) || !isImageNode(selection.node)) throw new Error(`Invalid ImageBorderToolItem render: ${JSON.stringify(selection)}`);

  // == Handler ===================================================================
  // update the Attributes and select the previous position
  const handleBorderColorChange = (value: string, focusEditor?: boolean) => {
  };

  // == Handler ===================================================================
  const value = selection.node.attrs[AttributeType.Alt] ?? ''/*default*/;
  return (
    <Box>
      <ColorPicker
        name='Border'
        value={value}
        onChange={handleBorderColorChange}
        colors={textColors}
      />
      <DropdownTool
        value={''}
        options={[]}
        placeholder={''}
        onChange={function (value: string): void {throw new Error('Function not implemented.'); }}
      />
      <DropdownTool
        value={''}
        options={[]}
        placeholder={''}
        onChange={function (value: string): void {throw new Error('Function not implemented.'); }}
      />
    </Box>
  );
};

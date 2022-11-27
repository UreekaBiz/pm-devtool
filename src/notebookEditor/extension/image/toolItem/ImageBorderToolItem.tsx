import { Box } from '@chakra-ui/react';

import { isImageNode, isNodeSelection, AttributeType, BorderStyle, NodeName, SetNodeSelectionDocumentUpdate, UpdateAttributesDocumentUpdate, DEFAULT_IMAGE_BORDER_COLOR } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { textColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';
import { ColorPickerTool } from 'notebookEditor/extension/shared/component/ColorPickerToolItem/ColorPickerTool';
import { DropdownToolItem } from 'notebookEditor/extension/shared/component/DropdownToolItem/DropdownToolItem';
import { InputWithUnitNodeToolItem } from 'notebookEditor/extension/shared/component/InputWithUnitToolItem';

// ********************************************************************************
// == Constant ====================================================================
const imageBorderStyleOptions = Object.values(BorderStyle).map((value) => ({ value, label: value }));

// == Component ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }
export const ImageBorderToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { selection } = editor.view.state,
    { pos: prevPos } = selection.$anchor;
  if(!isNodeSelection(selection) || !isImageNode(selection.node)) throw new Error(`Invalid ImageBorderToolItem render: ${JSON.stringify(selection)}`);

  // == Handler ===================================================================
  // update the Attributes and select the previous position
  const handleBorderColorChange = (value: string) => applyDocumentUpdates(editor, [
    new UpdateAttributesDocumentUpdate(NodeName.IMAGE, { [AttributeType.BorderColor]: value }),
    new SetNodeSelectionDocumentUpdate(prevPos),
  ]);

  // == UI ========================================================================
  const { node } = selection;
  let colorValue = node.attrs[AttributeType.BorderColor];

  return (
    <Box>
      <ColorPickerTool
        name='Border Color'
        value={colorValue ?? DEFAULT_IMAGE_BORDER_COLOR}
        onChange={handleBorderColorChange}
        colors={textColors}
      />
      <InputWithUnitNodeToolItem
        name='Border Weight'
        nodeName={NodeName.IMAGE}
        attributeType={AttributeType.BorderWidth}
        editor={editor}
        depth={depth}
      />
      <DropdownToolItem
        nodeName={NodeName.IMAGE}
        attributeType={AttributeType.BorderStyle}
        name={'Border Dash'}
        options={imageBorderStyleOptions}
        editor={editor}
        depth={depth}
      />
    </Box>
  );
};

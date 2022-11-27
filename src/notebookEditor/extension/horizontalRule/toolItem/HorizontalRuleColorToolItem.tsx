import { isHorizontalRuleNode, isNodeSelection, updateSingleNodeAttributesCommand, AttributeType, NodeName, DEFAULT_HORIZONTAL_RULE_BACKGROUND_COLOR } from 'common';

import { ColorPickerTool } from 'notebookEditor/extension/shared/component/ColorPickerToolItem/ColorPickerTool';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';
import { textColors } from 'notebookEditor/theme/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
export const HorizontalRuleColorToolItem: React.FC<Props> = ({ editor }) => {
  const { selection } = editor.view.state;
  const { anchor } = selection;
  if(!isNodeSelection(selection) || !isHorizontalRuleNode(selection.node)) throw new Error(`Invalid HorizontalRuleColorToolItem render: ${JSON.stringify(selection)}`);

  // -- Handler -------------------------------------------------------------------
  const handleBorderColorChange = (value: string) => {
    updateSingleNodeAttributesCommand(NodeName.HORIZONTAL_RULE, anchor, { [AttributeType.BackgroundColor]: value })(editor.view.state, editor.view.dispatch);
    editor.view.focus();
  };

  // -- UI ------------------------------------------------------------------------
  const backgroundColorValue = selection.node.attrs[AttributeType.BackgroundColor];
  return (
    <ColorPickerTool
      name='Color'
      value={backgroundColorValue ?? DEFAULT_HORIZONTAL_RULE_BACKGROUND_COLOR}
      onChange={handleBorderColorChange}
      colors={textColors}
    />
  );
};

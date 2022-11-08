import { isBlockquoteNode, updateSingleNodeAttributesCommand, AttributeType, NodeName, DEFAULT_BLOCKQUOTE_BORDER_LEFT_COLOR } from 'common';

import { ColorPickerTool } from 'notebookEditor/extension/shared/component/ColorPickerToolItem/ColorPickerTool';
import { textColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/ }

// == Component ===================================================================
export const BlockquoteBorderColorToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { selection } = editor.view.state;
  const { $anchor } = selection;
  if(!isBlockquoteNode($anchor.node(depth))) throw new Error(`Invalid BlockquoteBorderLeftWidthToolItem render: ${JSON.stringify(selection)}`);

  // == Handler ===================================================================
  const handleBorderColorChange = (value: string) => {
    updateSingleNodeAttributesCommand(NodeName.BLOCKQUOTE, $anchor.pos - $anchor.parentOffset - 1/*the Blockquote itself*/, { [AttributeType.BorderColor]: value })(editor.view.state, editor.view.dispatch);
    editor.view.focus();
  };

  // == UI ========================================================================
  const borderColorValue = $anchor.parent.attrs[AttributeType.BorderColor];
  return (
    <ColorPickerTool
      name='Border Color'
      value={borderColorValue ?? DEFAULT_BLOCKQUOTE_BORDER_LEFT_COLOR}
      onChange={handleBorderColorChange}
      colors={textColors}
    />
  );
};

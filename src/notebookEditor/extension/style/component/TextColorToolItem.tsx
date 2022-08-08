import { AttributeType, InvalidMergedAttributeValue } from 'common';

import { ColorPicker } from 'notebookEditor/extension/style/component/ColorPicker';
import { getTextDOMRenderedValue  } from 'notebookEditor/extension/util/attribute';
import { getSelectedNode } from 'notebookEditor/extension/util/node';
import { textColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// NOTE: This component update the TextColor attribute of the selected Node. This
//       should not be confused with TextColorMarkToolItem that adds a TextStyle
//       mark around the selected text that adds the color to the text.
interface Props extends EditorToolComponentProps {/*no additional*/}
export const TextColorToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { state } = editor;
  const node = getSelectedNode(state, depth);
  if(!node) return null/*nothing to render*/;

  const domRenderValue = getTextDOMRenderedValue(editor, AttributeType.TextColor);
  const inputValue = domRenderValue === InvalidMergedAttributeValue ? '' : domRenderValue;

  // == Handler ===================================================================
  const handleChange = (value: string, focusEditor?: boolean) => {
    editor.commands.setStyle(AttributeType.TextColor, value, depth);

    // Focus the editor again
    if(focusEditor) editor.commands.focus();
  };

  // == UI ========================================================================
  return (
    <ColorPicker name='Color' value={inputValue ?? ''} colors={textColors} onChange={handleChange} />
  );
};

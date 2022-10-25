import { getSelectedNode, updateAttributesInRangeCommand, AttributeType, InvalidMergedAttributeValue } from 'common';

import { ColorPicker } from 'notebookEditor/extension/style/component/ColorPicker';
import { getTextDOMRenderedValue  } from 'notebookEditor/extension/util/attribute';
import { keyboardShortcutTextColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// NOTE: This component update the Color attribute of the selected Node. This
//       should not be confused with TextColorMarkToolItem that adds a TextStyle
//       mark around the selected text that adds the color to the text.
interface Props extends EditorToolComponentProps {/*no additional*/}
export const TextColorToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { state } = editor;
  const node = getSelectedNode(state, depth);
  if(!node) return null/*nothing to render*/;

  const domRenderValue = getTextDOMRenderedValue(editor, AttributeType.Color);
  const inputValue = domRenderValue === InvalidMergedAttributeValue ? '' : domRenderValue;

  // == Handler ===================================================================
  const handleChange = (value: string, focusEditor?: boolean) => {
    updateAttributesInRangeCommand(AttributeType.Color, value, depth)(editor.state, editor.view.dispatch);

    // Focus the editor again
    if(focusEditor) editor.view.focus();
  };

  // == UI ========================================================================
  return (
    <ColorPicker name='Color' value={inputValue ?? ''} colors={keyboardShortcutTextColors} onChange={handleChange} />
  );
};

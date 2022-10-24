import { getSelectedNode, updateAttributesInRangeCommand, AttributeType, InvalidMergedAttributeValue } from 'common';

import { GoogleDocsColorPicker } from 'notebookEditor/extension/style/component/GoogleDocsColorPicker';
import { getTextDOMRenderedValue  } from 'notebookEditor/extension/util/attribute';
import { googleDocsColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// NOTE: This component update the Color attribute of the selected Node. This
//       should not be confused with TextColorMarkToolItem that adds a TextStyle
//       mark around the selected text that adds the color to the text.

// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
export const BackgroundColorToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { state } = editor;
  const node = getSelectedNode(state, depth);
  if(!node) return null/*nothing to render*/;

  const domRenderValue = getTextDOMRenderedValue(editor, AttributeType.BackgroundColor);
  const inputValue = domRenderValue === InvalidMergedAttributeValue ? '' : domRenderValue;

  // == Handler ===================================================================
  const handleChange = (value: string) => {
    updateAttributesInRangeCommand(AttributeType.BackgroundColor, value, depth)(editor.state, editor.view.dispatch);

    // focus the Editor again
    editor.view.focus();
  };

  // == UI ========================================================================
  return (<GoogleDocsColorPicker name='Block Background Color' value={inputValue ?? ''} colors={googleDocsColors} onChange={handleChange} />);
};

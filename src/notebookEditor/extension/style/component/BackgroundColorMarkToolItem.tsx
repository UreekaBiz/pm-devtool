import { getSelectedNode, setMarkCommand, AttributeType, InvalidMergedAttributeValue, MarkName } from 'common';

import { getTextDOMRenderedValue  } from 'notebookEditor/extension/util/attribute';
import { textColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';
import { ColorPicker } from './ColorPicker';

// ********************************************************************************
// NOTE: This component adds a TextStyle Mark in the selected text that adds the
//       color to the text. This does not update the Color attribute of the Node.
//       if that's the use case you should use ColorToolItem instead.

// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
export const BackgroundColorMarkToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { state } = editor;
  const node = getSelectedNode(state, depth);
  if(!node) return null/*nothing to render*/;

  const domRenderValue = getTextDOMRenderedValue(editor, AttributeType.BackgroundColor, MarkName.TEXT_STYLE);
  const inputValue = domRenderValue === InvalidMergedAttributeValue ? '' : domRenderValue;

  // == Handler ===================================================================
  const handleChange = (value: string) => {
    setMarkCommand(MarkName.TEXT_STYLE, { [AttributeType.BackgroundColor]: value })(editor.state, editor.view.dispatch);

    // focus the Editor again
    editor.view.focus();
  };

  // == UI ========================================================================
  return (<ColorPicker name='Inline Background Color' value={inputValue ?? ''} colors={textColors} onChange={handleChange} />);
};

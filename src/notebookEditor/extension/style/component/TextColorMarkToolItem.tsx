import { getSelectedNode, getThemeValue, setMarkCommand, AttributeType, InvalidMergedAttributeValue, MarkName, NodeName } from 'common';

import { getTextDOMRenderedValue  } from 'notebookEditor/extension/util/attribute';
import { textColors } from 'notebookEditor/theme/type';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

import { ColorPicker } from './ColorPicker';

// ********************************************************************************
// NOTE: This component adds a TextStyle mark in the selected text that adds the
//       color to the text. This does not update the Color attribute of the Node.
//       if that's the use case you should use ColorToolItem instead.
interface Props extends EditorToolComponentProps {/*no additional*/}
export const TextColorMarkToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { state } = editor;
  const node = getSelectedNode(state, depth);
  if(!node) return null/*nothing to render*/;

  const domRenderValue = getTextDOMRenderedValue(editor, AttributeType.Color, MarkName.TEXT_STYLE);
  const inputValue = domRenderValue === InvalidMergedAttributeValue ? '' : domRenderValue;
  const textColorValue = inputValue ?? getThemeValue(node.type.name as NodeName, AttributeType.Color) ?? ''/*none specified*/;

  // == Handler ===================================================================
  const handleChange = (value: string) => {
    setMarkCommand(MarkName.TEXT_STYLE, { [AttributeType.Color]: value })(editor.state, editor.view.dispatch);

    // focus the Editor again
    editor.view.focus();
  };

  // == UI ========================================================================
  return (<ColorPicker name='Text Color' value={textColorValue} colors={textColors} onChange={handleChange} />);
};

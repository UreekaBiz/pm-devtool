import { getMarkAttributes, getThemeValue, isLinkMarkAttributes, AttributeType, MarkName, ExtendMarkRangeDocumentUpdate, SetTextSelectionDocumentUpdate } from 'common';

import { applyDocumentUpdates } from 'notebookEditor/command/update';
import { ColorPicker } from 'notebookEditor/extension/style/component/ColorPicker';
import { textColors } from 'notebookEditor/theme';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

import { SetLinkDocumentUpdate } from '../../command';

// ********************************************************************************
interface Props extends EditorToolComponentProps {/*no additional*/}
// NOTE: Using custom ToolItem Component instead of using the ColorPickerInputToolItem
//       since the Link must be updated with custom meta tags and cannot work with
//       default behavior.
export const LinkColorToolItem: React.FC<Props> = ({ editor, depth }) => {
  const attrs = getMarkAttributes(editor.view.state, MarkName.LINK);
  if(!isLinkMarkAttributes(attrs)) return null/*nothing to render*/;

  // Get the value of the mark from the actual attribute or the theme is not present
  const themeValue = getThemeValue(MarkName.LINK, AttributeType.Color);
  const inputValue = attrs[AttributeType.Color] ?? themeValue ?? '';

  // == Handler ===================================================================
  const handleChange = (value: string) => {
    const { anchor: prevPos } = editor.view.state.selection;

    applyDocumentUpdates(editor, [
      new ExtendMarkRangeDocumentUpdate(MarkName.LINK, {/*no attributes*/}),
      new SetLinkDocumentUpdate({ ...attrs, [AttributeType.Color]: value }),
      new SetTextSelectionDocumentUpdate({ from: prevPos, to: prevPos }),
    ]);

    editor.view.focus();
  };

  // == UI ========================================================================
  return (<ColorPicker name='Color' value={inputValue} colors={textColors} onChange={handleChange} />);
};

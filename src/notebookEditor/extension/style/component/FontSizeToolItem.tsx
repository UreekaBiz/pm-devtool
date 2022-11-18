import { getSelectedNode, setMarkCommand, AttributeType, InvalidMergedAttributeValue, MarkName } from 'common';

import { getTextDOMRenderedValue } from 'notebookEditor/extension/util/attribute';
import { EditorToolComponentProps } from 'notebookEditor/toolbar/type';

import { UnitPickerInput } from './UnitPickerInput/UnitPickerInput';

// ********************************************************************************
// == Interface ===================================================================
interface Props extends EditorToolComponentProps {/*no additional*/}

// == Component ===================================================================
export const FontSizeToolItem: React.FC<Props> = ({ editor, depth }) => {
  const { state } = editor.view;
  const node = getSelectedNode(state, depth);
  if(!node) return null/*nothing to render*/;

  const domRenderValue = getTextDOMRenderedValue(editor, AttributeType.FontSize, MarkName.TEXT_STYLE);
  const inputValue = domRenderValue === InvalidMergedAttributeValue ? ''/*invalid*/ : domRenderValue;

  // == Handler ===================================================================
  const handleChange = (inputValue: string, focusEditor?: boolean) => {
    setMarkCommand(MarkName.TEXT_STYLE, { [AttributeType.FontSize]: inputValue })(editor.view.state, editor.view.dispatch);

    // Focus the editor again
    if(focusEditor) editor.view.focus();
  };

  // == UI ========================================================================
  return (<UnitPickerInput name='Font Size' onChange={handleChange} valueWithUnit={inputValue?.toString() ?? ''} />);
};

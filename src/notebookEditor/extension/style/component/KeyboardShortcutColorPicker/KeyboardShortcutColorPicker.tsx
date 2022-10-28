import { Input, InputGroup, InputLeftAddon } from '@chakra-ui/react';
import { ChangeEventHandler, KeyboardEventHandler } from 'react';

import { Color, colorToHexColor, removeColorAddon } from 'notebookEditor/theme/type';
import { ToolContainer } from 'notebookEditor/toolbar/ToolbarContainer';
import { useLocalValue } from 'notebookEditor/shared/hook/useLocalValue';

import { KeyboardShortcutColorPickerMenu } from './KeyboardShortcutColorPickerMenu';

// ********************************************************************************
// == Constant ====================================================================
const LEFT_ADDON_TEXT = '#';

// == Interface ===================================================================
interface Props {
  name: string;

  value: string;
  onChange: (value: string, focus?: boolean) => void;

  colors: Color[][];
}

// == Component ===================================================================
export const KeyboardShortcutColorPicker: React.FC<Props> = ({ colors, name, onChange, value }) => {
  // -- State ---------------------------------------------------------------------
  const { commitChange, localValue, resetLocalValue, updateLocalValue } = useLocalValue(value, onChange);

  // -- Handler -------------------------------------------------------------------
  const handleColorPickerChange = (color: Color) => {
    const value = color.hexCode;
    updateLocalValue(value);
    commitChange(value);
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = colorToHexColor(event.target.value);
    updateLocalValue(value);
  };

  const saveChange = (focus: boolean = true/*focus editor by default*/) => {
    if(localValue) commitChange(undefined/*use stored value*/, focus);
    else resetLocalValue();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    // save changes when user presses Enter
    if(event.key === 'Enter') {
      // prevent defaults so that PM does not handle the event
      event.preventDefault();
      event.stopPropagation();

      // save change
      saveChange();
    } /* else -- ignore */
  };

  // -- UI ------------------------------------------------------------------------
  return (
    <ToolContainer name={name} width='auto'>
     <InputGroup size='sm' marginTop='5px' marginBottom='5px' gap={1} borderRadius='15px'>
      <KeyboardShortcutColorPickerMenu value={localValue} colors={colors} onChange={handleColorPickerChange} />

      <InputLeftAddon>{LEFT_ADDON_TEXT}</InputLeftAddon>
      <Input
        type='text'
        value={removeColorAddon(localValue)}
        onBlur={() => saveChange(false/*don't focus editor*/)}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
     </InputGroup>
    </ToolContainer>
  );
};

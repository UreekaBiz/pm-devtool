/* eslint-disable react/no-children-prop */
import { Input, InputGroup, InputLeftAddon } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { Color } from '../../../type';
import { ColorMenuButton } from './ColorMenuButton';

// ********************************************************************************
interface Props {/*in passing order*/
  toolName: string;
  leftAddonText: string;
  currentColor: string;
  colors: Color[][];
  buttonCallback: (color: Color) => void;
  inputCallback: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
export const InputWithLeftAddon = ({ toolName, leftAddonText, currentColor, colors, buttonCallback, inputCallback }: Props) => {
  // == State =====================================================================
  const [inputValue, setInputValue] = useState('');

  // == Effect ====================================================================
  useEffect(() => {
    setInputValue(currentColor);
  }, [currentColor]);

  // == UI ========================================================================
  return (
    <InputGroup
      size={'sm'}
      marginTop={'5px'}
      marginBottom={'5px'}
      gap={1}
      borderRadius={'15px'}
    >
      <ColorMenuButton
        currentColor={currentColor}
        colors={colors}
        buttonCallback={buttonCallback}
      />
      <InputLeftAddon children={leftAddonText} />
      <Input
        id={toolName}
        type={'text'}
        value={inputValue}
        onChange={(event) => { setInputValue(event.target.value); inputCallback(event); }}
      />
    </InputGroup>
  );
};

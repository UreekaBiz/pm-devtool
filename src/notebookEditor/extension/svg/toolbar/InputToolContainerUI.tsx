import { Box, Input, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { LIGHT_GRAY } from 'notebookEditor/theme/theme';

// ********************************************************************************
interface Props {
  toolName: string;
  toolTitle: string;
  currentValue: string;
  updateValueCallback: (value: string) => void;
}
export const InputToolContainerUI: React.FC<Props> = ({ toolName, toolTitle, currentValue, updateValueCallback }) => {
  const [inputValue, setInputValue] = useState('');
  const [shouldUpdateValue, setShouldUpdateValue] = useState(false);

  // == Effects ===================================================================
  useEffect(() => { /*show current value on render*/
    setInputValue(currentValue);
  }, [currentValue]);

  useEffect(() => { /*update height on enter or tab press*/
    if(shouldUpdateValue === false) return;

    updateValueCallback(inputValue);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUpdateValue/*explicitly only on shouldUpdateValue change*/]);

  // == Handlers ==================================================================
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value);

  const handleKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if(event.code === 'Tab' || event.code === 'Enter') {
      setShouldUpdateValue(true);
      return/*work done*/;
    } /* else -- handle keydown regularly */

    setShouldUpdateValue(false);
  };

  // == UI ========================================================================
  return (
    <Box w={'full'} mb={4} mt={2}>
      <Text fontSize={'14px'}>{toolTitle}</Text>
      <Input
        id={toolName}
        variant={'unstyled'}
        value={inputValue}
        style={{ border: `1px solid ${LIGHT_GRAY}` }}
        textAlign={'center'}
        size={'sm'}
        w={'25%'}
        ml={'2px'}
        mr={'2px'}
        mt={1}
        autoComplete={'off'}
        color={'black'}
        onChange={handleChange}
        onKeyDown={handleKeydown}
      />
    </Box>
  );
};

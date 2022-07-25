import { Box, Flex, FlexProps, Popover, PopoverArrow, PopoverContent, PopoverTrigger, Portal, Text } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { colorToHexColor } from 'notebookEditor/extension/drawing/util/style';
import { isValidHTMLElement } from 'notebookEditor/extension/util/parse';
import { FOCUS_COLOR } from 'notebookEditor/theme/theme';

import { Color } from '../../../type';

// ********************************************************************************
// == Constant ====================================================================
export const SELECT_COLOR_BUTTON = 'selectColorButton';
const selectColorButtonProps: Partial<FlexProps> = {
  alignItems: 'flex-end',
  flexDirection: 'row-reverse',
  width: '32px',
  height: '32px',
  borderRadius: '4px',
  _focus: { boxShadow: 'none' },
};

interface Props {
  buttonCallback: (color: Color) => void;
  currentColor: string;
  colors: Color[][];
}
export const ColorMenuButton = ({ buttonCallback, currentColor, colors }: Props) => {
  const initialFocusRef = useRef(null);

  // == State =====================================================================
  const [colorsShown, setColorsShown] = useState(false);
  const [selectedColorHex, setSelectedColorHex] = useState('');

  // == Effect ====================================================================
  useEffect(() => {
    const hideColors = (event: MouseEvent) => {
      const { target } = event;

      if(!colorsShown || !(isValidHTMLElement(target))) return;
      const id = target.getAttribute('id');

      if(!id || /*not an important element*/
        (id.includes(SELECT_COLOR_BUTTON) && id !== `${SELECT_COLOR_BUTTON}-${currentColor}`) || /*display another color menu*/
        target.tagName === 'INPUT' /*focused another tool with an id*/
      ) setColorsShown(!colorsShown);
    };

    const selectColorWithKey = (event: KeyboardEvent) => {
      if(!colorsShown || event.ctrlKey || event.altKey || event.metaKey) return;
      if(event.key === 'Escape') {
        setColorsShown(!colorsShown);
        return;
      }
      /* else-- select color */

      colors.forEach(row => {
        row.forEach(color => {
          if(color.key === event.key) {
            buttonCallback(color);
            setSelectedColorHex(color.hexCode);
          }
          /* else -- do nothing */
        });
      });
    };

    window.addEventListener('mousedown', hideColors);
    window.addEventListener('keydown', selectColorWithKey);

    return () => {
      window.removeEventListener('mousedown', hideColors);
      window.removeEventListener('keydown', selectColorWithKey);
    };
  }, [colorsShown, currentColor, buttonCallback, colors]);

  // == UI ========================================================================
  return (
    <Popover placement={'bottom'} isOpen={colorsShown}>
      <PopoverTrigger>
        {/* This box receives the chakra popover-specific id */}
        <Box ref={initialFocusRef} onClick={() => setColorsShown(!colorsShown)}>
          <Box
            id={`${SELECT_COLOR_BUTTON}-${currentColor}`}
            backgroundColor={colorToHexColor(currentColor)}
            borderRadius={'4px'}
            _focus={{ boxShadow: 'none' }}
            _hover={{ cursor: 'pointer', backgroundColor: colorToHexColor(currentColor) }}
            {...selectColorButtonProps}
          />
        </Box>
      </PopoverTrigger>
      <Portal>
        <PopoverContent _focus={{ boxShadow: 'none' }} width={'fit-content'}>
          <PopoverArrow />
          {
            colors.map((row, rowIndex) =>
              <Flex
                key={rowIndex}
                gap={'1'}
                justifyContent={'space-between'}
              >
                {row.map(((color, colorIndex) =>
                  <Flex
                    id={`${color.hexCode}-${colorIndex}`}
                    key={colorIndex}
                    margin={'5px'}
                    backgroundColor={color.hexCode}
                    _hover={{ cursor: 'pointer', backgroundColor: color.hexCode }}
                    border={color.hexCode === selectedColorHex ? `2px solid ${FOCUS_COLOR}` : 'none'}
                    {...selectColorButtonProps}
                    onClick={() => { setSelectedColorHex(color.hexCode); buttonCallback(color); }}
                  >
                    <Text
                      id={color.key}
                      padding={'3px'}
                      color={'white'}
                      fontSize={'12px'}
                    >
                      {color.key}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            )
          }
        </PopoverContent>
      </Portal>
    </Popover >
  );
};

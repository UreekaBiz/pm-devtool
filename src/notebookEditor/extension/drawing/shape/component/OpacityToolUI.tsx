import { Box, Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { computeRectStyle, RectangleAttributes } from 'common';

import { SHAPE_G } from '../../constant';
import { styleToCSSString } from '../../util/style';
import { nodeIDtoShapeID } from '../../util/ui';

// ********************************************************************************
interface Props {
  toolTitle: string;
  nodeAttrs: { [key: string]: any; };
  currentOpacity: number;
  callback: (opacity: number) => void;
}
export const OpacityToolUI = ({ toolTitle, nodeAttrs, currentOpacity, callback }: Props) => {
  // == State =====================================================================
  const [sliderValue, setSliderValue] = useState(0);

  // == Effect ====================================================================
  useEffect(()=>{
    setSliderValue(opacityToSliderValue(currentOpacity));
  }, [currentOpacity]);

  // == Handler ===================================================================
  const handleSliderChange = (value: number) => {
    const shapeG = document.getElementById(`${SHAPE_G}-${nodeIDtoShapeID(nodeAttrs.id)}`);
    if(!shapeG) throw new Error(`ShapeG for shape ${nodeAttrs.id} not defined when it should by contract`);

    const temporaryRectStyle = computeRectStyle(nodeAttrs as RectangleAttributes/*by contract*/);
          temporaryRectStyle.opacity = sliderValueToOpacity(value);

    setSliderValue(value);
    shapeG.setAttribute('style', styleToCSSString(temporaryRectStyle));
  };

  // == UI ========================================================================
  return (
    <Box width={'full'} marginTop={3} marginBottom={3} marginRight={3}>
      <Text fontSize={'14px'}>{toolTitle}</Text>
      <Slider
        aria-label={'slider-ex-6'}
        value={sliderValue}
        onChange={handleSliderChange}
        onChangeEnd={(value) => callback(sliderValueToOpacity(value))}
      >
        <SliderMark value={25} marginTop='1' marginLeft='-2.5' fontSize='sm'>0.25</SliderMark>
        <SliderMark value={50} marginTop='1' marginLeft='-2.5' fontSize='sm'>0.50</SliderMark>
        <SliderMark value={75} marginTop='1' marginLeft='-2.5' fontSize='sm'>0.75</SliderMark>

        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>

        <SliderThumb />
      </Slider>
    </Box>
  );
};

// == Util ========================================================================
const opacityToSliderValue = (opacity: number) => opacity * 100;
const sliderValueToOpacity = (value: number) => value / 100;
